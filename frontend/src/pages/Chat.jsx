import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";

import ChatAudioController from "./ChatAudioController";
import useWebRTC from "../hooks/useWebRTC";
import MessageBubble from "../components/MessageBubble";

const BAD_WORDS = ["fuck", "sex", "nude", "rape"];

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
  const [isExiting, setIsExiting] = useState(false);

  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);
  const exitHandledRef = useRef(false);
  const timerRef = useRef(null);
  const endingRef = useRef(false);
  const mountedRef = useRef(true);

  const webrtc = useWebRTC({ socket, matchId, isCaller });
  const { connectionState, resetCall, localStream } = webrtc;

  /* =======================
     TIMER
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
    console.log("🔄 New match, resetting state", matchId);
    mountedRef.current = true;
    exitHandledRef.current = false;
    endingRef.current = false;
    setMessages([]);
    setShowToast(false);
    setSeconds(0);
    setIsExiting(false);

    if (matchId && !audioOn && resetCall) {
      resetCall();
    }

    return () => {
      mountedRef.current = false;
    };
  }, [matchId, audioOn, resetCall]);

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
      if (!mountedRef.current) return;
      setMessages((prev) => [
        ...prev,
        {
          ...msg,
          id: msg.id ?? crypto.randomUUID(),
          from: "partner",
        },
      ]);
    };

    const onTyping = () => mountedRef.current && setIsTyping(true);
    const onStopTyping = () => mountedRef.current && setIsTyping(false);

    const onCallEnded = ({ reason }) => {
      if (!mountedRef.current) return;
      console.log("🔚 Call ended event:", reason);
      triggerExit(reason || "disconnect");
    };

    const onPartnerDisconnected = ({ reason }) => {
      if (!mountedRef.current) return;
      console.log("👋 Partner disconnected:", reason);
      triggerExit(reason || "partner_left");
    };

    const onDisconnect = () => {
      if (!mountedRef.current) return;
      console.log("🔌 Socket disconnected");
      triggerExit("disconnect");
    };

    socket.on("receive_message", onReceive);
    socket.on("partner_typing", onTyping);
    socket.on("partner_stop_typing", onStopTyping);
    socket.on("call-ended", onCallEnded);
    socket.on("partner_disconnected", onPartnerDisconnected);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("receive_message", onReceive);
      socket.off("partner_typing", onTyping);
      socket.off("partner_stop_typing", onStopTyping);
      socket.off("call-ended", onCallEnded);
      socket.off("partner_disconnected", onPartnerDisconnected);
      socket.off("disconnect", onDisconnect);
    };
  }, [socket]);

  /* =======================
     SEND MESSAGE
  ======================= */
  const containsBadWord = (value) =>
    BAD_WORDS.some((w) => value.toLowerCase().includes(w));

  const sendMessage = useCallback(() => {
    if (!text.trim() || !mountedRef.current) return;

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
     CLEANUP
  ======================= */
  const cleanupLocal = useCallback((reason = "unknown") => {
    if (!mountedRef.current) return;

    console.log("🧹 cleanupLocal called", {
      endingRef: endingRef.current,
      reason,
      matchId
    });

    if (endingRef.current) {
      console.log("Already ending, skipping cleanup");
      return;
    }

    endingRef.current = true;

    if (onEnd && mountedRef.current) {
      console.log("👋 Notifying parent component");
      onEnd();
    }
  }, [matchId, onEnd]);

  useEffect(() => {
    return () => {
      console.log("🔄 Chat component unmounting", matchId);
      mountedRef.current = false;
      if (matchId && resetCall) {
        resetCall();
      }
    };
  }, [matchId, resetCall]);

  /* =======================
     EXIT HANDLING
  ======================= */
  const triggerExit = (reason) => {
    if (!mountedRef.current || exitHandledRef.current) return;

    exitHandledRef.current = true;
    console.log("🚪 Triggering exit, reason:", reason);
    setIsExiting(true);

    const message =
      reason === "timeout" ? "⏱️ Conversation ended (10 min limit)" :
        reason === "manual" ? "❌ Call ended" :
          reason === "partner_left" ? "👋 Partner disconnected" :
            "🔌 Disconnected";

    setToastText(message);
    setShowToast(true);

    if (reason === "manual") {
      cleanupLocal(reason);
    } else {
      setTimeout(() => cleanupLocal(reason), 500);
    }
  };

  const handleManualEnd = () => {
    if (!mountedRef.current || exitHandledRef.current) return;
    console.log("👋 Manual end triggered");

    if (socket && matchId) {
      socket.emit("call-ended", { matchId, reason: "manual" });
    }
    triggerExit("manual");
  };

  /* =======================
     REPORT USER
  ======================= */
  const reportUser = () => {
    if (!socket || !matchId || !mountedRef.current) return;
    socket.emit("report_user", { matchId });
    setToastText("🚩 User reported. Thank you.");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 1500);
  };

  /* =======================
     EXIT SCREEN
  ======================= */
  if (isExiting) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="text-4xl mb-4">👋</div>
          <div className="text-slate-600 dark:text-slate-400">{toastText}</div>
        </div>
      </div>
    );
  }

  /* =======================
     MAIN RENDER - AUDIO MODE
  ======================= */
  if (audioOn) {
    return (
      <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        {/* Header - Same for both modes */}
        <div className="flex justify-between items-center px-4 py-3 border-b bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex items-center gap-3 text-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-slate-700 dark:text-slate-300">⏱ {formatTime()}</span>
            {connectionState && connectionState !== "connected" && (
              <span className="text-yellow-500 text-xs bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded-full">
                {connectionState}
              </span>
            )}
          </div>

          <div className="flex gap-3 items-center">
            <button
              onClick={reportUser}
              className="text-xs px-3 py-1 rounded-full bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition"
            >
              🚩 Report
            </button>
            <button
              onClick={handleManualEnd}
              className="text-sm px-4 py-1 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition"
            >
              End
            </button>
          </div>
        </div>

        {/* Audio Controller - Full height */}
        <div className="flex-1">
          <ChatAudioController
            audioOn={audioOn}
            setAudioOn={setAudioOn}
            isCaller={isCaller}
            webrtc={webrtc}
            onEndCall={handleManualEnd}
          />
        </div>

        {/* Toast Notifications */}
        {showToast && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[10000] bg-black text-white px-5 py-2 rounded-xl shadow-lg animate-fade-in">
            {toastText}
          </div>
        )}
      </div>
    );
  }

  /* =======================
     MAIN RENDER - TEXT MODE
  ======================= */
  return (
    <>
      {showToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[10000] bg-black text-white px-5 py-2 rounded-xl shadow-lg animate-fade-in">
          {toastText}
        </div>
      )}

      <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        {/* Header */}
        <div className="flex justify-between items-center px-4 py-3 border-b bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex items-center gap-3 text-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-slate-700 dark:text-slate-300">⏱ {formatTime()}</span>
            {connectionState && connectionState !== "connected" && (
              <span className="text-yellow-500 text-xs bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded-full">
                {connectionState}
              </span>
            )}
          </div>

          <div className="flex gap-3 items-center">
            <button
              onClick={reportUser}
              className="text-xs px-3 py-1 rounded-full bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition"
            >
              🚩 Report
            </button>
            <button
              onClick={handleManualEnd}
              className="text-sm px-4 py-1 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition"
            >
              End
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-slate-400 dark:text-slate-600 mt-10">
              <div className="text-6xl mb-4">💬</div>
              <p>Start the conversation...</p>
            </div>
          ) : (
            messages.map((m) => (
              <MessageBubble key={m.id} m={m} />
            ))
          )}

          {isTyping && (
            <div className="flex items-center gap-2 text-slate-400 px-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
              </div>
              <span className="text-xs">Partner is typing</span>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input Area */}
        <div className="sticky bottom-0 p-4 border-t bg-white dark:bg-slate-900 shadow-lg">
          <div className="flex gap-3 items-center max-w-4xl mx-auto">
            <input
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                if (socket?.connected) {
                  socket.emit("typing");
                }

                clearTimeout(typingTimeout.current);
                typingTimeout.current = setTimeout(() => {
                  if (socket?.connected) {
                    socket.emit("stop_typing");
                  }
                }, 700);
              }}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type a message…"
              className="flex-1 px-5 py-3 rounded-full bg-slate-100 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition"
              disabled={!socket?.connected}
            />

            <button
              onClick={sendMessage}
              disabled={!text.trim() || !socket?.connected}
              className="px-6 py-3 rounded-full bg-indigo-600 text-white font-medium hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md hover:shadow-lg"
            >
              Send
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translate(-50%, -10px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default Chat;