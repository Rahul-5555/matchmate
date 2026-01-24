import React, { useEffect, useRef, useState } from "react";
import ChatAudioController from "./ChatAudioController";
import useWebRTC from "../hooks/useWebRTC";

const Chat = ({
  socket,
  onEnd,
  matchId,
  mode,
  audioOn,
  setAudioOn,
  isCaller,
}) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [partnerMuted, setPartnerMuted] = useState(false);

  const [showToast, setShowToast] = useState(false);
  const [toastText, setToastText] = useState("");

  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);
  const exitHandledRef = useRef(false);

  /* 🔥 SINGLE WEBRTC INSTANCE */
  const webrtc = useWebRTC({
    socket,
    matchId,
    isCaller,
  });

  /* 🔁 RESET ON NEW MATCH */
  useEffect(() => {
    exitHandledRef.current = false;
    setMessages([]);
    setShowToast(false);
    setToastText("");
    setPartnerMuted(false);
  }, [matchId]);

  /* 🔽 AUTO SCROLL (CHAT MODE ONLY) */
  useEffect(() => {
    if (!audioOn) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, audioOn]);

  /* 🔔 REMOTE AUDIO END → STOP AUDIO UI */
  useEffect(() => {
    if (!socket) return;

    const handleRemoteAudioEnd = () => {
      setAudioOn(false);        // 🔥 stop timer + UI
    };

    socket.on("audio:ended", handleRemoteAudioEnd);

    return () => {
      socket.off("audio:ended", handleRemoteAudioEnd);
    };
  }, [socket, setAudioOn]);

  /* 👀 TOAST + DELAY EXIT */
  const triggerExitWithToast = (reason = "ended") => {
    if (exitHandledRef.current) return;
    exitHandledRef.current = true;

    if (reason === "timeout") {
      setToastText("⏱️ Chat timed out");
    } else if (reason === "left") {
      setToastText("👀 Partner left the chat");
    } else {
      setToastText("👀 Chat ended");
    }

    setShowToast(true);

    setTimeout(() => {
      cleanupAndExit();
    }, 2000);
  };

  /* 🔌 CHAT SOCKET EVENTS ONLY */
  useEffect(() => {
    if (!socket) return;

    const onReceive = (msg) => {
      setMessages((p) => [...p, { from: "partner", text: msg.text }]);
    };

    socket.on("receive_message", onReceive);
    socket.on("partner_typing", () => setIsTyping(true));
    socket.on("partner_stop_typing", () => setIsTyping(false));
    socket.on("partner_left", () => triggerExitWithToast("left"));
    socket.on("match_timeout", () => triggerExitWithToast("timeout"));

    return () => {
      socket.off("receive_message", onReceive);
      socket.off("partner_typing");
      socket.off("partner_stop_typing");
      socket.off("partner_left");
      socket.off("match_timeout");
    };
  }, [socket]);

  /* ❌ FINAL CHAT EXIT */
  const cleanupAndExit = () => {
    setShowToast(false);
    setMessages([]);
    setPartnerMuted(false);

    // 🔥 audio + webrtc cleanup
    webrtc.endCall(false);
    setAudioOn(false);

    onEnd(); // navigation / stage change
  };

  /* 💬 SEND MESSAGE */
  const sendMessage = () => {
    if (!text.trim()) return;

    setMessages((p) => [...p, { from: "me", text }]);
    socket.emit("send_message", { text });
    socket.emit("stop_typing");
    setText("");
  };

  return (
    <>
      {/* 👀 TOAST */}
      {showToast && (
        <div className="fixed top-6 z-[10000] bg-black/80 text-white px-4 py-2 rounded-xl shadow-lg">
          {toastText}
        </div>
      )}

      <div className="h-screen flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-white">
        {/* HEADER */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-white/10">
          <div className="text-sm">
            🟢 Connected
            {audioOn && <span className="ml-1">• Audio Call</span>}
            {partnerMuted && (
              <div className="text-xs opacity-60">🔇 Partner muted</div>
            )}
          </div>

          <button
            onClick={cleanupAndExit}
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            End
          </button>
        </div>

        {/* 🔊 AUDIO MODE → ONLY AUDIO UI */}
        {audioOn ? (
          <ChatAudioController
            audioOn={audioOn}
            setAudioOn={setAudioOn}
            isCaller={isCaller}
            webrtc={webrtc}
          />
        ) : (
          <>
            {/* 💬 CHAT */}
            <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[75%] px-3 py-2 rounded-xl text-sm ${m.from === "me"
                    ? "self-end bg-indigo-600 text-white"
                    : "self-start bg-slate-200 dark:bg-white/10"
                    }`}
                >
                  {m.text}
                </div>
              ))}

              {isTyping && (
                <span className="text-xs opacity-60">Typing…</span>
              )}

              <div ref={bottomRef} />
            </div>

            {/* ⌨️ INPUT */}
            <div className="flex items-center gap-3 p-3 border-t bg-white dark:bg-slate-900">
              <input
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  socket.emit("typing");
                  clearTimeout(typingTimeout.current);
                  typingTimeout.current = setTimeout(
                    () => socket.emit("stop_typing"),
                    800
                  );
                }}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                className="flex-1 px-4 py-2 rounded-xl text-sm bg-slate-100 dark:bg-white/10 outline-none"
              />

              <button
                onClick={sendMessage}
                className="px-5 py-2 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Send
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default Chat;
