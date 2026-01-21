import React, { useEffect, useState, useRef } from "react";

const Chat = ({ socket, onEnd }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false); // ✅ NEW
  const bottomRef = useRef(null);
  const typingTimeout = useRef(null); // ✅ NEW

  // auto-scroll (UX only)
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (!socket) return;

    const handleReceive = (msg) => {
      setMessages((prev) => [...prev, { from: "partner", text: msg.text }]);
    };

    const handlePartnerLeft = () => {
      alert("Partner left the chat");
      setMessages([]);
      onEnd();
    };

    // ✍️ typing handlers
    const handlePartnerTyping = () => setIsTyping(true);
    const handlePartnerStopTyping = () => setIsTyping(false);

    socket.on("receive_message", handleReceive);
    socket.on("partner_left", handlePartnerLeft);
    socket.on("partner_typing", handlePartnerTyping);
    socket.on("partner_stop_typing", handlePartnerStopTyping);

    return () => {
      socket.off("receive_message", handleReceive);
      socket.off("partner_left", handlePartnerLeft);
      socket.off("partner_typing", handlePartnerTyping);
      socket.off("partner_stop_typing", handlePartnerStopTyping);
    };
  }, [socket, onEnd]);

  const sendMessage = () => {
    if (!text.trim()) return;

    setMessages((prev) => [...prev, { from: "me", text }]);
    socket.emit("send_message", text);
    socket.emit("stop_typing"); // ✅ stop typing on send
    setText("");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020617",
        color: "white",
        display: "flex",
        flexDirection: "column",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          padding: "14px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.03)",
          backdropFilter: "blur(10px)",
        }}
      >
        <span style={{ fontSize: "14px", opacity: 0.8 }}>
          🟢 Connected
        </span>
        <button
          onClick={onEnd}
          style={{
            background: "transparent",
            border: "none",
            color: "#93c5fd",
            cursor: "pointer",
            fontSize: "13px",
          }}
        >
          End
        </button>
      </div>

      {/* MESSAGES */}
      <div
        style={{
          flex: 1,
          padding: "16px",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              alignSelf: msg.from === "me" ? "flex-end" : "flex-start",
              maxWidth: "75%",
            }}
          >
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "16px",
                fontSize: "14px",
                lineHeight: "1.4",
                background:
                  msg.from === "me"
                    ? "linear-gradient(135deg, #2563eb, #4f46e5)"
                    : "rgba(255,255,255,0.12)",
              }}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {/* ✍️ TYPING INDICATOR */}
        {isTyping && (
          <div
            style={{
              fontSize: "12px",
              opacity: 0.6,
              marginLeft: "4px",
            }}
          >
            Typing…
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div
        style={{
          padding: "12px",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.03)",
          display: "flex",
          gap: "10px",
        }}
      >
        <input
          value={text}
          onChange={(e) => {
            setText(e.target.value);

            // ✍️ emit typing
            socket.emit("typing");

            // debounce stop typing
            if (typingTimeout.current) {
              clearTimeout(typingTimeout.current);
            }

            typingTimeout.current = setTimeout(() => {
              socket.emit("stop_typing");
            }, 800);
          }}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message…"
          style={{
            flex: 1,
            padding: "12px 14px",
            borderRadius: "14px",
            border: "none",
            outline: "none",
            background: "rgba(255,255,255,0.1)",
            color: "white",
            fontSize: "14px",
          }}
        />
        <button
          onClick={sendMessage}
          style={{
            padding: "12px 18px",
            borderRadius: "14px",
            border: "none",
            background:
              "linear-gradient(135deg, #2563eb, #4f46e5)",
            color: "white",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;
