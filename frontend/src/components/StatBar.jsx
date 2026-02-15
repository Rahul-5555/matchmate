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
    mt-5 sm:mt-7
    mx-auto
    w-[92%] sm:w-full
    max-w-sm sm:max-w-md
    rounded-xl sm:rounded-2xl
    px-3 sm:px-5
    py-2.5 sm:py-3
    flex items-center justify-between
    backdrop-blur-xl
    bg-white/90 dark:bg-white/5
    border border-slate-200 dark:border-white/10
    shadow-md dark:shadow-lg
    transition-all
  "
    >
      {/* ONLINE */}
      <div className="flex mt-2 items-center gap-3 sm:gap-4">

        {/* Online Dot */}
        <div className="relative mb-3 flex items-center justify-center">
          {/* Ping Ring */}
          <span className="absolute h-3 w-3 rounded-full bg-green-400/60 animate-ping" />

          {/* Solid Dot */}
          <span className="relative h-2.5 w-2.5 rounded-full bg-green-500" />
        </div>


        {/* Text Content */}
        <div className="flex flex-col leading-tight">
          <span className="text-sm sm:text-base font-semibold text-slate-800 dark:text-white tabular-nums">
            {displayCount.toLocaleString()}
            <span className="ml-1 text-slate-600 dark:text-white/70 font-medium">
              online
            </span>
          </span>

          <span className="text-[11px] sm:text-xs text-slate-500 dark:text-white/50">
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
