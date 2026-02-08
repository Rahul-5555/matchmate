import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import ChatAudioController from "./ChatAudioController";
import useWebRTC from "../hooks/useWebRTC";
import MessageBubble from "../components/MessageBubble";

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

  const [showToast, setShowToast] = useState(false);
  const [toastText, setToastText] = useState("");

  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);
  const exitHandledRef = useRef(false);

  const webrtc = useWebRTC({ socket, matchId, isCaller });

  /* =======================
     RESET ON NEW MATCH
  ======================= */
  useEffect(() => {
    exitHandledRef.current = false;
    setMessages([]);
    setShowToast(false);
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
          status: "delivered",
          reactions: {
            counts: {},
            myReaction: null,
          },
        },
      ]);
    };

    const onTyping = () => setIsTyping(true);
    const onStopTyping = () => setIsTyping(false);
    const onPartnerLeft = () => triggerExit("left");
    const onTimeout = () => triggerExit("timeout");

    socket.on("receive_message", onReceive);
    socket.on("partner_typing", onTyping);
    socket.on("partner_stop_typing", onStopTyping);
    socket.on("partner_left", onPartnerLeft);
    socket.on("match_timeout", onTimeout);

    return () => {
      socket.off("receive_message", onReceive);
      socket.off("partner_typing", onTyping);
      socket.off("partner_stop_typing", onStopTyping);
      socket.off("partner_left", onPartnerLeft);
      socket.off("match_timeout", onTimeout);
    };
  }, [socket]);

  /* =======================
     SEND MESSAGE
  ======================= */
  const sendMessage = useCallback(() => {
    if (!text.trim()) return;

    const msg = {
      id: crypto.randomUUID(),
      text,
      from: "me",
      status: "sent",
      reactions: {
        counts: {},
        myReaction: null,
      },
    };

    setMessages((prev) => [...prev, msg]);
    socket.emit("send_message", msg);
    socket.emit("stop_typing");
    setText("");
  }, [text, socket]);

  /* =======================
     SINGLE REACTION LOGIC
  ======================= */
  const handleReaction = (messageId, emoji) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;

        const prevReaction = m.reactions.myReaction;
        const newCounts = { ...m.reactions.counts };

        if (prevReaction) {
          newCounts[prevReaction] -= 1;
          if (newCounts[prevReaction] === 0) {
            delete newCounts[prevReaction];
          }
        }

        newCounts[emoji] = (newCounts[emoji] || 0) + 1;

        return {
          ...m,
          reactions: {
            counts: newCounts,
            myReaction: emoji,
          },
        };
      })
    );

    // socket.emit("message_reaction", { messageId, emoji });
  };

  /* =======================
     EXIT HANDLING
  ======================= */
  const cleanupAndExit = () => {
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
        ? "⏱️ Chat timed out"
        : "👀 Partner left the chat"
    );

    setShowToast(true);
    setTimeout(cleanupAndExit, 1800);
  };

  return (
    <>
      {/* TOAST */}
      {showToast && (
        <div className="
          fixed top-6 z-[10000]
          bg-black/90 text-white
          px-5 py-2 rounded-xl
          shadow-lg animate-fadeIn
        ">
          {toastText}
        </div>
      )}

      <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        {/* HEADER */}
        <div className="
          flex justify-between items-center
          px-4 py-3
          border-b border-slate-200 dark:border-slate-800
        ">
          <span className="text-sm text-slate-600 dark:text-slate-300">
            🟢 Connected
          </span>

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
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
              {messages.map((m) => (
                <MessageBubble
                  key={m.id}
                  m={m}
                  onReact={handleReaction}
                />
              ))}

              {isTyping && (
                <div className="text-xs italic text-slate-400 px-2">
                  Partner is typing…
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* INPUT */}
            <div className="
              sticky bottom-0 p-3
              border-t border-slate-200 dark:border-slate-800
              bg-white dark:bg-slate-900
            ">
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
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Type a message…"
                  className="
                    flex-1 px-4 py-3 rounded-full
                    bg-slate-100 dark:bg-slate-800
                    text-slate-900 dark:text-white
                    focus:outline-none focus:ring-2 focus:ring-indigo-500
                  "
                />

                <button
                  onClick={sendMessage}
                  className="
                    px-5 py-3 rounded-full
                    bg-indigo-600 text-white
                    hover:bg-indigo-700
                  "
                >
                  Send
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* MICRO ANIMATION */}
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
