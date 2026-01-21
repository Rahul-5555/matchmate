import React from "react";
const MatchFound = ({ onContinue }) => {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "radial-gradient(circle, #020617, #000)",
        color: "white",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: "28px", marginBottom: "12px" }}>
          🎉 Match Found!
        </h1>

        <p style={{ opacity: 0.7, marginBottom: "28px" }}>
          You are now connected to a random person
        </p>

        <button
          onClick={onContinue}
          style={{
            padding: "14px 24px",
            borderRadius: "16px",
            border: "none",
            background: "linear-gradient(135deg, #22c55e, #16a34a)",
            color: "white",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          Start Chat 💬
        </button>
      </div>
    </div>
  );
};

export default MatchFound;
