import React, { useRef, useState, useEffect } from "react";
import { io } from "socket.io-client";

import Header from "../components/Header";
import StatBar from "../components/StatBar";
import ActionButton from "../components/ActionButton";
import Matching from "./Matching";
import Chat from "./Chat";

const Home = () => {
  const [stage, setStage] = useState("home");
  const [socket, setSocket] = useState(null);

  const socketRef = useRef(null);

  // ✅ CREATE SOCKET ON APP LOAD
  useEffect(() => {
    const s = io("http://localhost:5000", {
      transports: ["websocket"],
    });

    socketRef.current = s;
    setSocket(s);

    s.on("connect", () => {
      console.log("🟢 Socket connected:", s.id);
    });

    return () => {
      s.disconnect();
    };
  }, []);

  // 👉 Only change stage now
  const startMatching = () => {
    setStage("matching");
  };

  // 🔄 MATCHING SCREEN
  if (stage === "matching" && socket) {
    return (
      <Matching
        socket={socket}
        onMatched={() => setStage("chat")}
      />
    );
  }

  // 💬 CHAT SCREEN
  if (stage === "chat" && socket) {
    return (
      <Chat
        socket={socket}
        onEnd={() => setStage("matching")}
      />
    );
  }

  const secondaryBtn = {
    width: "100%",
    padding: "14px",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.15)",
    background: "transparent",
    color: "white",
    cursor: "pointer",
    opacity: 0.8,
  };

  // 🏠 HOME UI — MODERN
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background:
          "radial-gradient(circle at top, #1e293b 0%, #020617 60%)",
        color: "white",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          padding: "32px 24px",
          borderRadius: "24px",
          background: "rgba(255,255,255,0.05)",
          backdropFilter: "blur(14px)",
          boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
          textAlign: "center",
        }}
      >
        {/* LOGO / TITLE */}
        <h1
          style={{
            fontSize: "28px",
            fontWeight: "700",
            letterSpacing: "1px",
          }}
        >
          ♟ MatchMate
        </h1>

        <p
          style={{
            marginTop: "8px",
            fontSize: "14px",
            opacity: 0.7,
          }}
        >
          Random anonymous chats. One match at a time.
        </p>

        {/* ONLINE USERS */}
        <div
          style={{
            marginTop: "20px",
            display: "inline-block",
          }}
        >
          <StatBar socket={socket} />
        </div>

        {/* PRIMARY ACTION */}
        <button
          onClick={startMatching}
          style={{
            marginTop: "32px",
            width: "100%",
            padding: "16px",
            fontSize: "16px",
            fontWeight: "600",
            borderRadius: "14px",
            border: "none",
            cursor: "pointer",
            color: "white",
            background:
              "linear-gradient(135deg, #2563eb, #4f46e5)",
            boxShadow: "0 10px 30px rgba(37,99,235,0.4)",
          }}
        >
          🌐 Start Random Chat
        </button>

        {/* SECONDARY ACTIONS */}
        <div
          style={{
            marginTop: "16px",
            display: "grid",
            gap: "12px",
          }}
        >
          <button
            style={secondaryBtn}
          >
            🎧 Voice Talk (Coming soon)
          </button>

          <button
            style={secondaryBtn}
          >
            🧩 Daily Question
          </button>
        </div>

        {/* FOOTER */}
        <p
          style={{
            marginTop: "24px",
            fontSize: "12px",
            opacity: 0.4,
          }}
        >
          No login • No history • 100% anonymous
        </p>
      </div>
    </div>
  );

};

export default Home;
