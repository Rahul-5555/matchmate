import React, { useEffect, useState } from "react";

const StatBar = ({ socket }) => {
  const [online, setOnline] = useState(0);

  useEffect(() => {
    if (!socket) return;

    const handleOnlineCount = (count) => {
      setOnline(count);
    };

    // 👇 LISTEN
    socket.on("online_count", handleOnlineCount);

    // 👇 ASK server explicitly (THIS FIXES 0 BUG)
    socket.emit("get_online_count");

    return () => {
      socket.off("online_count", handleOnlineCount);
    };
  }, [socket]);

  return (
    <div
      style={{
        marginTop: "28px",
        padding: "12px 16px",
        borderRadius: "14px",
        background: "rgba(255,255,255,0.05)",
        display: "flex",
        justifyContent: "space-between",
        fontSize: "13px",
        color: "white",
      }}
    >
      <span>👥 {online} Online</span>
      <span>🔴 Matching…</span>
    </div>
  );
};

export default StatBar;
