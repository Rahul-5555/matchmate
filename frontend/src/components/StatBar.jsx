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
    <div className="mt-6 px-4 relative">

      {/* Soft Glow Background */}
      <div className="absolute inset-0 flex justify-center">
        <div className="w-72 h-40 bg-green-400/20 blur-3xl rounded-full animate-pulse" />
      </div>

      <div
        className="
        relative
        mx-auto w-full max-w-xl
        rounded-2xl
        px-6 py-5
        bg-gradient-to-r from-white via-green-50 to-white
        dark:from-[#111] dark:via-[#0f0f0f] dark:to-[#111]
        border border-slate-200 dark:border-[#1f1f1f]
        shadow-lg dark:shadow-[0_8px_25px_rgba(0,0,0,0.7)]
        hover:scale-[1.02]
        transition-all duration-300
      "
      >

        {/* TOP ROW */}
        <div className="flex items-center justify-between">

          {/* LEFT SIDE - AVATARS + COUNT */}
          <div className="flex items-center gap-4">

            {/* Avatar Stack */}
            <div className="flex -space-x-3">
              <img
                src="https://i.pravatar.cc/40?img=11"
                className="w-8 h-8 rounded-full border-2 border-white dark:border-[#0f0f0f]"
                alt="user1"
              />
              <img
                src="https://i.pravatar.cc/40?img=12"
                className="w-8 h-8 rounded-full border-2 border-white dark:border-[#0f0f0f]"
                alt="user2"
              />
              <img
                src="https://i.pravatar.cc/40?img=13"
                className="w-8 h-8 rounded-full border-2 border-white dark:border-[#0f0f0f]"
                alt="user3"
              />
            </div>

            {/* Live Count */}
            <span className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">
              {displayCount.toLocaleString()}
            </span>
          </div>

          {/* RIGHT SIDE - LIVE STATUS */}
          <div className="flex items-center gap-2">

            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
            </span>

            <span className="text-green-500 text-sm font-semibold">
              Live Now
            </span>
          </div>
        </div>

        {/* SUBTEXT */}
        <div className="mt-3 text-sm text-slate-600 dark:text-gray-400">
          People matching and chatting right now. Join the conversation.
        </div>

      </div>
    </div>
  );

};

export default StatBar;
