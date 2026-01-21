import React from "react";
const ActionButton = ({ text, onClick }) => {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "16px",
        borderRadius: "18px",
        border: "none",
        background: "linear-gradient(135deg, #2563eb, #1e40af)",
        color: "white",
        fontSize: "16px",
        fontWeight: "600",
        cursor: "pointer",
        transition: "transform 0.15s ease",
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      {text}
    </button>
  );
};

export default ActionButton;


