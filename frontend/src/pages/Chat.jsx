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

  const [showToast, setShowToast] = useState(false);
  const [toastText, setToastText] = useState("");

  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);
  const exitHandledRef = useRef(false);

  const webrtc = useWebRTC({ socket, matchId, isCaller });

  /* 🔁 RESET ON NEW MATCH */
  useEffect(() => {
    exitHandledRef.current = false;
    setMessages([]);
    setShowToast(false);
    setToastText("");
  }, [matchId]);

  /* 🔽 AUTO SCROLL */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  /* 🔌 SOCKET EVENTS */
  useEffect(() => {
    if (!socket) return;

    const onReceive = (msg) => {
      setMessages((prev) => [
        ...prev,
        {
          ...msg,
          id: msg.id ?? crypto.randomUUID(),
          from: "partner",
          status: "delivered",
        },
      ]);

      socket.emit("message_delivered", { messageId: msg.id });
    };

    const onStatusUpdate = ({ messageId, status }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, status } : m
        )
      );
    };

    socket.on("receive_message", onReceive);
    socket.on("message_status", onStatusUpdate);
    socket.on("partner_typing", () => setIsTyping(true));
    socket.on("partner_stop_typing", () => setIsTyping(false));
    socket.on("partner_left", () => triggerExitWithToast("left"));
    socket.on("match_timeout", () => triggerExitWithToast("timeout"));

    return () => {
      socket.off("receive_message", onReceive);
      socket.off("message_status", onStatusUpdate);
    };
  }, [socket]);

  /* 💬 SEND */
  const sendMessage = () => {
    if (!text.trim()) return;

    const msg = {
      id: crypto.randomUUID(),
      text,
      status: "sent",
    };

    setMessages((prev) => [...prev, { ...msg, from: "me" }]);
    socket.emit("send_message", msg);
    socket.emit("stop_typing");
    setText("");
  };

  /* ❌ EXIT */
  const cleanupAndExit = () => {
    setShowToast(false);
    webrtc.endCall(false);
    setAudioOn(false);
    onEnd();
  };

  const triggerExitWithToast = (reason) => {
    if (exitHandledRef.current) return;
    exitHandledRef.current = true;

    setToastText(
      reason === "timeout"
        ? "⏱️ Chat timed out"
        : "👀 Partner left the chat"
    );

    setShowToast(true);
    setTimeout(cleanupAndExit, 2000);
  };

  return (
    <>
      {/* 🔔 TOAST */}
      {showToast && (
        <div className="fixed top-6 z-[10000] bg-black/90 text-white px-5 py-2 rounded-xl shadow-lg">
          {toastText}
        </div>
      )}

      <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
        {/* HEADER */}
        <div className="flex justify-between items-center px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <div className="text-sm text-slate-600 dark:text-slate-300">
            🟢 Connected
          </div>
          <button
            onClick={cleanupAndExit}
            className="text-sm text-red-500 hover:text-red-600"
          >
            End
          </button>
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
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm leading-relaxed shadow-sm ${m.from === "me"
                    ? "ml-auto bg-indigo-600 text-white rounded-br-sm"
                    : "mr-auto bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-sm"
                    }`}
                >
                  <div>{m.text}</div>

                  {m.from === "me" && (
                    <div className="text-[10px] text-right opacity-70 mt-1">
                      {m.status === "sent" && "✔"}
                      {m.status === "delivered" && "✔✔"}
                      {m.status === "seen" && "👁"}
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="text-xs italic text-slate-400">
                  Partner is typing…
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* INPUT */}
            <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="flex gap-3 items-center">
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
                  placeholder="Type a message…"
                  className="flex-1 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <button
                  onClick={sendMessage}
                  className="px-5 py-2 rounded-full bg-indigo-600 text-white text-sm hover:bg-indigo-700 transition"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default Chat;
