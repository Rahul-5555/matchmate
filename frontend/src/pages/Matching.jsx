import React, { useEffect, useRef, useState } from "react";

const Matching = ({ socket, onMatched }) => {
  const hasRequestedMatch = useRef(false);
  const [dots, setDots] = useState("");

  // 🔁 UI animation only (logic independent)
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length === 3 ? "" : prev + "."));
    }, 500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!socket) return;

    // 🔒 ensure find_match runs only once
    if (!hasRequestedMatch.current) {
      socket.emit("find_match");
      hasRequestedMatch.current = true;
    }

    const handleMatchFound = () => {
      onMatched();
    };

    socket.on("match_found", handleMatchFound);

    return () => {
      socket.off("match_found", handleMatchFound);
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
        {/* TITLE */}
        <h2
          style={{
            fontSize: "20px",
            fontWeight: "600",
          }}
        >
          Finding opponent{dots}
        </h2>

        {/* SUBTEXT */}
        <p
          style={{
            marginTop: "10px",
            fontSize: "14px",
            opacity: 0.7,
          }}
        >
          Looking for a random opponent
        </p>

        {/* LOADER */}
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

        {/* FOOTER */}
        <p
          style={{
            marginTop: "22px",
            fontSize: "12px",
            opacity: 0.4,
          }}
        >
          This usually takes a few seconds
        </p>
      </div>

      {/* KEYFRAMES (UI ONLY) */}
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
