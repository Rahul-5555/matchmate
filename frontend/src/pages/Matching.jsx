import React, { useEffect, useRef, useState } from "react";

const Matching = ({ socket, onMatched }) => {
  const hasRequestedMatch = useRef(false);
  const [dots, setDots] = useState("");

  /* 🔁 UI animation */
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length === 3 ? "" : prev + "."));
    }, 500);

    return () => clearInterval(interval);
  }, []);

  /* 🔌 MATCHING LOGIC */
  useEffect(() => {
    if (!socket) return;

    // 🔒 emit find_match only once
    if (!hasRequestedMatch.current) {
      socket.emit("find_match");
      hasRequestedMatch.current = true;
      console.log("📤 find_match emitted");
    }

    const handleMatchFound = (data) => {
      if (!data || !data.matchId) {
        console.warn("⚠️ match_found without matchId", data);
        return;
      }
      onMatched(data.matchId);
    };

    // 🧹 SAFETY HANDLERS
    const handlePartnerLeft = () => {
      console.log("⚠️ partner_left while matching");
      hasRequestedMatch.current = false;
      socket.emit("find_match"); // retry safely
    };

    const handleTimeout = () => {
      console.log("⏱️ match_timeout while matching");
      hasRequestedMatch.current = false;
      socket.emit("find_match");
    };

    socket.on("match_found", handleMatchFound);
    socket.on("partner_left", handlePartnerLeft);
    socket.on("match_timeout", handleTimeout);

    return () => {
      socket.off("match_found", handleMatchFound);
      socket.off("partner_left", handlePartnerLeft);
      socket.off("match_timeout", handleTimeout);

      // 🔴 VERY IMPORTANT CLEANUP
      hasRequestedMatch.current = false;
      socket.emit("leave-room"); // safe no-op if not in room
    };
  }, [socket, onMatched]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, #1e293b 0%, #020617 65%)",
        color: "white",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "360px",
          padding: "32px 24px",
          borderRadius: "24px",
          background: "rgba(255,255,255,0.05)",
          backdropFilter: "blur(16px)",
          textAlign: "center",
          boxShadow: "0 20px 40px rgba(0,0,0,0.45)",
        }}
      >
        <h2 style={{ fontSize: "20px", fontWeight: "600" }}>
          Finding opponent{dots}
        </h2>

        <p style={{ marginTop: "10px", fontSize: "14px", opacity: 0.7 }}>
          Looking for a random opponent
        </p>

        <div
          style={{
            marginTop: "28px",
            width: "100%",
            height: "6px",
            borderRadius: "6px",
            background: "rgba(255,255,255,0.1)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: "40%",
              height: "100%",
              background:
                "linear-gradient(90deg, #2563eb, #4f46e5)",
              animation: "loading 1.2s infinite ease-in-out",
            }}
          />
        </div>

        <p style={{ marginTop: "22px", fontSize: "12px", opacity: 0.4 }}>
          This usually takes a few seconds
        </p>
      </div>

      <style>
        {`
          @keyframes loading {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(300%); }
          }
        `}
      </style>
    </div>
  );
};

export default Matching;
