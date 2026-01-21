import React, { useRef, useState, useEffect } from "react";
import { io } from "socket.io-client";

import StatBar from "../components/StatBar";
import Matching from "./Matching";
import Chat from "./Chat";

// 🖼 HERO IMAGE
import heroImg from "../assets/heroS.png";

const Home = () => {
  const [stage, setStage] = useState("home");
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);

  // 🔌 SOCKET INIT
  useEffect(() => {
    const s = io(import.meta.env.VITE_SOCKET_URL, {
      transports: ["websocket"],
      withCredentials: true,
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

  const startMatching = () => {
    setStage("matching");
  };

  // 🔄 MATCHING
  if (stage === "matching" && socket) {
    return <Matching socket={socket} onMatched={() => setStage("chat")} />;
  }

  // 💬 CHAT
  if (stage === "chat" && socket) {
    return <Chat socket={socket} onEnd={() => setStage("matching")} />;
  }

  // 🏠 HOME
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #020617, #0f172a)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "24px",
        color: "white",
      }}
    >
      {/* HERO CARD */}
      <div
        style={{
          position: "relative",
          maxWidth: "1100px",
          width: "100%",
          height: "520px",
          borderRadius: "32px",
          overflow: "hidden",
          boxShadow: "0 40px 80px rgba(0,0,0,0.7)",
        }}
      >
        {/* IMAGE */}
        <img
          src={heroImg}
          alt="Anonymous people sitting apart"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "brightness(0.85)",
          }}
        />

        {/* DARK OVERLAY */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, rgba(2,6,23,0.85) 20%, rgba(2,6,23,0.4) 55%, rgba(2,6,23,0.1))",
          }}
        />

        {/* 🔰 BRAND NAME */}
        {/* 🔰 BRAND NAME */}
        <div
          style={{
            position: "absolute",
            top: "28px",
            left: "32px",
            padding: "10px 18px",
            borderRadius: "999px",
            background: "rgba(255,255,255,0.08)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.15)",
            fontSize: "20px",
            fontWeight: "800",
            letterSpacing: "1px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          ♟
          <span
            style={{
              background: "linear-gradient(135deg, #38bdf8, #6366f1)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            MatchMate
          </span>
        </div>


        {/* TEXT OVER IMAGE */}
        <div
          style={{
            position: "absolute",
            left: "48px",
            bottom: "48px",
            maxWidth: "420px",
          }}
        >
          <h1
            style={{
              fontSize: "44px",
              fontWeight: "800",
              lineHeight: "1.1",
            }}
          >
            Talk Freely.
            <br />
            <span
              style={{
                background:
                  "linear-gradient(135deg, #38bdf8, #6366f1)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Stay Anonymous.
            </span>
          </h1>

          <p
            style={{
              marginTop: "14px",
              fontSize: "15px",
              opacity: 0.85,
            }}
          >
            Meet random people worldwide. No login. No profile.
            Just honest conversations.
          </p>

          {/* ONLINE USERS */}
          <div style={{ marginTop: "16px" }}>
            <StatBar socket={socket} />
          </div>

          {/* CTA */}
          <button
            onClick={startMatching}
            style={{
              marginTop: "22px",
              padding: "16px 34px",
              borderRadius: "999px",
              border: "none",
              fontSize: "15px",
              fontWeight: "600",
              cursor: "pointer",
              color: "white",
              background:
                "linear-gradient(135deg, #2563eb, #4f46e5)",
              boxShadow: "0 18px 36px rgba(79,70,229,0.5)",
            }}
          >
            🌐 Start Random Chat
          </button>

          <p
            style={{
              marginTop: "12px",
              fontSize: "12px",
              opacity: 0.6,
            }}
          >
            No login • No history • 100% anonymous
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
