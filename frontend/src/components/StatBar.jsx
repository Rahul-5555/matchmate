import React, { useEffect, useState } from "react";

const StatBar = ({ socket }) => {
  const [online, setOnline] = useState(0);

  useEffect(() => {
    if (!socket) return;

    const handleOnlineCount = (count) => setOnline(count);

    socket.on("online_count", handleOnlineCount);
    socket.emit("get_online_count");

    return () => socket.off("online_count", handleOnlineCount);
  }, [socket]);

  return (
    <div
      className="
        mt-7 mx-auto w-full max-w-md
        rounded-2xl
        px-4 py-3
        flex items-center justify-between
        backdrop-blur-xl
        bg-white/80 dark:bg-white/5
        border border-slate-200 dark:border-white/10
        shadow-sm dark:shadow-lg
      "
    >
      {/* 👥 ONLINE COUNT */}
      <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-white">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-60 animate-ping" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
        </span>
        <span>{online} Online</span>
      </div>

      {/* 🔴 MATCHING STATUS */}
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-white/70">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 animate-pulse" />
        </span>
        Matching…
      </div>
    </div>
  );
};

export default StatBar;
