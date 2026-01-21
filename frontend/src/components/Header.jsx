import React from "react";
const Header = () => {
  return (
    <div style={{ textAlign: "center", marginTop: "12px" }}>
      <h1
        style={{
          fontSize: "34px",
          fontWeight: "700",
          letterSpacing: "1px",
        }}
      >
        ♞ MatchMate
      </h1>

      <p
        style={{
          marginTop: "8px",
          opacity: 0.7,
          fontSize: "14px",
        }}
      >
        Connect. Talk. Disconnect.
      </p>
    </div>
  );
};

export default Header;

