import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";

import ChatAudioController from "./ChatAudioController";
import useWebRTC from "../hooks/useWebRTC";
import MessageBubble from "../components/MessageBubble";

const BAD_WORDS = ["fuck", "sex", "nude", "rape"]; // basic guard

const Chat = ({
  socket,
  onEnd,
  matchId,
  audioOn,
  setAudioOn,
  isCaller,
}) => {

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const [showToast, setShowToast] = useState(false);
  const [toastText, setToastText] = useState("");

  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);
  const exitHandledRef = useRef(false);
  const timerRef = useRef(null);

  const webrtc = useWebRTC({ socket, matchId, isCaller });

  /* =======================
     SAFE TIMER
  ======================= */

  useEffect(() => {
    clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [matchId]);

  const formatTime = () => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  /* =======================
     RESET ON NEW MATCH
  ======================= */

  useEffect(() => {
    exitHandledRef.current = false;
    setMessages([]);
    setShowToast(false);
    setSeconds(0);
  }, [matchId]);

  /* =======================
     AUTO SCROLL
  ======================= */

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  /* =======================
     SOCKET EVENTS
  ======================= */

  useEffect(() => {
    if (!socket) return;

    const onReceive = (msg) => {
      setMessages((prev) => [
        ...prev,
        {
          ...msg,
          id: msg.id ?? crypto.randomUUID(),
          from: "partner",
        },
      ]);
    };

    const onTyping = () => setIsTyping(true);
    const onStopTyping = () => setIsTyping(false);

    const onCallEnded = ({ reason }) => {
      triggerExit(reason === "timeout" ? "timeout" : "left");
    };

    const onDisconnect = () => {
      triggerExit("left");
    };

    socket.on("receive_message", onReceive);
    socket.on("partner_typing", onTyping);
    socket.on("partner_stop_typing", onStopTyping);
    socket.on("call-ended", onCallEnded);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("receive_message", onReceive);
      socket.off("partner_typing", onTyping);
      socket.off("partner_stop_typing", onStopTyping);
      socket.off("call-ended", onCallEnded);
      socket.off("disconnect", onDisconnect);
    };
  }, [socket]);

  /* =======================
     SEND MESSAGE
  ======================= */

  const containsBadWord = (value) => {
    return BAD_WORDS.some((w) =>
      value.toLowerCase().includes(w)
    );
  };

  const sendMessage = useCallback(() => {
    if (!text.trim()) return;

    if (containsBadWord(text)) {
      setToastText("⚠️ Please be respectful.");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 1500);
      return;
    }

    const msg = {
      id: crypto.randomUUID(),
      text,
      from: "me",
    };

    setMessages((prev) => [...prev, msg]);

    socket.emit("send_message", msg);
    socket.emit("stop_typing");

    setText("");
  }, [text, socket]);

  /* =======================
     EXIT HANDLING
  ======================= */

  const cleanupAndExit = () => {
    clearInterval(timerRef.current);
    setShowToast(false);
    webrtc.endCall(false);
    setAudioOn(false);
    onEnd();
  };

  const triggerExit = (reason) => {
    if (exitHandledRef.current) return;
    exitHandledRef.current = true;

    setToastText(
      reason === "timeout"
        ? "⏱️ Conversation ended (10 min limit)"
        : "👀 Partner disconnected"
    );

    setShowToast(true);

    setTimeout(cleanupAndExit, 1700);
  };

  /* =======================
     REPORT USER
  ======================= */

  const reportUser = () => {
    socket.emit("report_user", { matchId });
    setToastText("🚩 User reported. Thank you.");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 1500);
  };

  return (
    <>
      {showToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[10000] bg-black text-white px-5 py-2 rounded-xl shadow-lg animate-fadeIn">
          {toastText}
        </div>
      )}

      <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-950">

        {/* HEADER */}
        <div className="flex justify-between items-center px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">

          <div className="flex items-center gap-3 text-sm">
            <span className="text-green-500">🟢 Connected</span>
            <span className="text-slate-500 dark:text-slate-400">
              ⏱ {formatTime()}
            </span>
          </div>

          <div className="flex gap-4 items-center">
            <button
              onClick={reportUser}
              className="text-xs text-yellow-500 hover:text-yellow-600"
            >
              🚩 Report
            </button>

            <button
              onClick={cleanupAndExit}
              className="text-sm text-red-500 hover:text-red-600"
            >
              End
            </button>
          </div>
        </div>

        {audioOn ? (
          <ChatAudioController
            audioOn={audioOn}
            setAudioOn={setAudioOn}
            isCaller={isCaller}
            webrtc={webrtc}
          />
        ) : (
          <>
            {/* CHAT BODY */}
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
              {messages.map((m) => (
                <MessageBubble key={m.id} m={m} />
              ))}

              {isTyping && (
                <div className="text-xs italic text-slate-400 px-2">
                  Partner is typing…
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* INPUT */}
            <div className="sticky bottom-0 p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex gap-3 items-center">
                <input
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);

                    socket.emit("typing");

                    clearTimeout(typingTimeout.current);
                    typingTimeout.current = setTimeout(
                      () => socket.emit("stop_typing"),
                      700
                    );
                  }}
                  onKeyDown={(e) =>
                    e.key === "Enter" && sendMessage()
                  }
                  placeholder="Type a message…"
                  className="flex-1 px-4 py-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <button
                  onClick={sendMessage}
                  className="px-5 py-3 rounded-full bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-6px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fadeIn {
            animation: fadeIn 0.25s ease-out;
          }
        `}
      </style>
    </>
  );
};

export default Chat;
