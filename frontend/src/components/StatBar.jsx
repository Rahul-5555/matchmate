import React, { useEffect, useRef, useState } from "react";

const StatBar = ({
  socket,
  status = "idle", // idle | matching | connected
}) => {

  const [online, setOnline] = useState(0);
  const [displayCount, setDisplayCount] = useState(0);

  const animRef = useRef(null);

  /* =======================
     LISTEN ONLINE COUNT
  ======================= */

  useEffect(() => {
    if (!socket) return;

    const handleOnline = (count) => {
      setOnline(count);
    };

    socket.on("online_count", handleOnline);

    // 🔥 IMPORTANT: request initial count
    socket.emit("get_online_count");

    return () => {
      socket.off("online_count", handleOnline);
    };
  }, [socket]);

  /* =======================
     SMOOTH NUMBER ANIMATION
  ======================= */

  useEffect(() => {
    if (displayCount === online) return;

    clearInterval(animRef.current);

    const diff = online - displayCount;
    const steps = 10;
    const stepValue = diff / steps;
    let currentStep = 0;

    animRef.current = setInterval(() => {
      currentStep++;

      setDisplayCount((prev) => {
        const next = prev + stepValue;

        if (currentStep >= steps) {
          clearInterval(animRef.current);
          return online;
        }

        return Math.round(next);
      });

    }, 30);

    return () => clearInterval(animRef.current);
  }, [online]);

  /* =======================
     STATUS STYLES
  ======================= */

  const STATUS_MAP = {
    matching: {
      text: "Matching",
      color: "bg-red-500",
      animate: "animate-pulse",
    },
    connected: {
      text: "Connected",
      color: "bg-green-500",
      animate: "",
    },
    idle: {
      text: "Ready",
      color: "bg-yellow-500",
      animate: "animate-pulse",
    },
  };

  const currentStatus = STATUS_MAP[status];

  return (
    <div
      className="
        mt-7 mx-auto w-full max-w-md
        rounded-2xl px-5 py-3
        flex items-center justify-between
        backdrop-blur-xl
        bg-white/90 dark:bg-white/5
        border border-slate-200 dark:border-white/10
        shadow-md dark:shadow-lg
        transition-all
      "
    >

      {/* ONLINE */}
      <div className="flex items-center gap-3 text-sm font-medium text-slate-700 dark:text-white">

        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-60 animate-ping" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
        </span>

        <div className="flex flex-col leading-tight">
          <span>{displayCount.toLocaleString()} online</span>
          <span className="text-[11px] opacity-60">
            Real people active now
          </span>
        </div>

      </div>

      {/* STATUS */}
      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-white/70">

        <span className="relative flex h-2 w-2">
          <span
            className={`
              absolute inline-flex h-full w-full rounded-full
              ${currentStatus.color} ${currentStatus.animate}
            `}
          />
        </span>

        {currentStatus.text}

      </div>
    </div>
  );
};

export default StatBar;
