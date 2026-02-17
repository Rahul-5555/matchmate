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
     STATUS MAP
  ======================= */

  const STATUS_MAP = {
    matching: {
      text: "Matching",
      dot: "bg-red-500",
      textColor: "text-red-500 dark:text-red-400",
      pulse: "animate-pulse",
    },
    connected: {
      text: "Connected",
      dot: "bg-green-500",
      textColor: "text-green-600 dark:text-green-400",
      pulse: "",
    },
    idle: {
      text: "Ready",
      dot: "bg-yellow-500",
      textColor: "text-yellow-600 dark:text-yellow-400",
      pulse: "animate-pulse",
    },
  };

  const currentStatus = STATUS_MAP[status];

  return (
    <div className="mt-6 px-4">
      <div
        className="
        mx-auto w-full max-w-xl
        rounded-xl
        px-6 py-4
        bg-white dark:bg-[#0f0f0f]
        border border-slate-200 dark:border-[#1f1f1f]
        shadow-md dark:shadow-[0_8px_20px_rgba(0,0,0,0.6)]
        transition-colors
      "
      >
        {/* TOP ROW */}
        <div className="flex items-center justify-between">

          {/* LEFT - DOT + NUMBER */}
          <div className="flex items-center gap-3">

            <div className="relative flex items-center justify-center h-5 w-5">
              <span className="absolute h-3 w-3 rounded-full bg-green-500 opacity-30 animate-pulse" />
              <span className="relative h-2.5 w-2.5 rounded-full bg-green-500" />
            </div>

            <span className="text-sm font-semibold text-slate-900 dark:text-white tabular-nums leading-none">
              {displayCount.toLocaleString()}
            </span>
          </div>

          {/* RIGHT - STATUS */}
          <div className="flex items-center gap-2">

            <span className="relative flex items-center justify-center h-2.5 w-2.5">
              <span
                className={`
                  absolute h-full w-full rounded-full
                  ${currentStatus.dot} ${currentStatus.pulse}
                `}
              />
            </span>

            <span
              className={`
                text-sm font-medium leading-none
                ${currentStatus.textColor}
              `}
            >
              {currentStatus.text}
            </span>
          </div>
        </div>

        {/* SUBTEXT */}
        <div className="mt-1 text-xs text-slate-500 dark:text-gray-500">
          people online
        </div>

      </div>
    </div>
  );
};

export default StatBar;
