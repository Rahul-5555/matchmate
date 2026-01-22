import React, { useEffect, useState, useRef } from "react";
import AudioCall from "../components/AudioCall";

const Chat = ({ socket, onEnd, matchId, mode }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [audioOn, setAudioOn] = useState(false);
  const [partnerMuted, setPartnerMuted] = useState(false);

  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);
  const exitHandledRef = useRef(false); // 🔒 single exit guard

  /* 🔽 AUTO SCROLL */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  /* 🔽 JOIN / LEAVE ROOM */
  useEffect(() => {
    if (!socket || !matchId) return;

    socket.emit("join-room", matchId);

    return () => {
      socket.emit("leave-room", matchId);
    };
  }, [socket, matchId]);

  /* 🔥 AUTO START AUDIO MODE */
  const autoStartedRef = useRef(false);

  useEffect(() => {
    if (mode === "audio" && !autoStartedRef.current) {
      autoStartedRef.current = true;
      setAudioOn(true);
    }
  }, [mode]);


  /* 🔌 SOCKET EVENTS */
  useEffect(() => {
    if (!socket) return;

    const handleReceive = (msg) => {
      setMessages((prev) => [...prev, { from: "partner", text: msg.text }]);
    };

    const handlePartnerLeft = () => {
      if (exitHandledRef.current) return;
      alert("Partner left the chat");
      cleanupAndExit();
    };

    const handleTyping = () => setIsTyping(true);
    const handleStopTyping = () => setIsTyping(false);

    const handlePartnerMuted = () => setPartnerMuted(true);
    const handlePartnerUnmuted = () => setPartnerMuted(false);

    const handleMatchTimeout = () => {
      if (exitHandledRef.current) return;
      alert("⏱️ Chat ended (time over)");
      cleanupAndExit();
    };

    socket.on("receive_message", handleReceive);
    socket.on("partner_left", handlePartnerLeft);
    socket.on("partner_typing", handleTyping);
    socket.on("partner_stop_typing", handleStopTyping);
    socket.on("partner_muted", handlePartnerMuted);
    socket.on("partner_unmuted", handlePartnerUnmuted);
    socket.on("match_timeout", handleMatchTimeout);

    return () => {
      socket.off("receive_message", handleReceive);
      socket.off("partner_left", handlePartnerLeft);
      socket.off("partner_typing", handleTyping);
      socket.off("partner_stop_typing", handleStopTyping);
      socket.off("partner_muted", handlePartnerMuted);
      socket.off("partner_unmuted", handlePartnerUnmuted);
      socket.off("match_timeout", handleMatchTimeout);
    };
  }, [socket, matchId]);

  /* 🔧 SINGLE EXIT POINT */
  const cleanupAndExit = () => {
    if (exitHandledRef.current) return;
    exitHandledRef.current = true;

    setMessages([]);
    setAudioOn(false);
    setPartnerMuted(false);

    socket.emit("leave-room", matchId);

    // 🔥 ONLY PLACE WHERE HOME NAVIGATION HAPPENS
    onEnd();
  };

  const sendMessage = () => {
    if (!text.trim()) return;

    setMessages((prev) => [...prev, { from: "me", text }]);
    socket.emit("send_message", text);
    socket.emit("stop_typing");
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
        }}
      >
        <div>
          <span style={{ fontSize: "14px", opacity: 0.8 }}>
            🟢 Connected {mode === "audio" && "• Audio"}
          </span>

          {partnerMuted && (
            <div style={{ fontSize: "12px", opacity: 0.6 }}>
              🔇 Partner muted
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          {mode === "chat" && !audioOn && (
            <button
              onClick={() => setAudioOn(true)}
              style={{
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "#93c5fd",
                padding: "6px 10px",
                borderRadius: "8px",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              🎧 Audio
            </button>
          )}

          <button
            onClick={cleanupAndExit}
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
      </div>

      {/* 🔊 AUDIO CALL (ONLY WHEN audioOn) */}
      {audioOn && (
        <AudioCall
          socket={socket}
          matchId={matchId}
          onEnd={() => {
            setAudioOn(false); // 🔊 sirf audio band
          }}
        />
      )}

      {/* 💬 MESSAGES */}
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

        {isTyping && (
          <div style={{ fontSize: "12px", opacity: 0.6 }}>
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
            socket.emit("typing");

            if (typingTimeout.current) clearTimeout(typingTimeout.current);

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
