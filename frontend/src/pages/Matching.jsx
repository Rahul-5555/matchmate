import React, { useEffect, useRef, useState } from "react";

const Matching = ({ socket, onMatched }) => {
  const matchedRef = useRef(false);
  const timeoutRef = useRef(null);

  const [dots, setDots] = useState("");
  const [elapsed, setElapsed] = useState(0);

  /* 🔁 Animated dots */
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length === 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  /* ⏱️ Elapsed time counter (psychological trust) */
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((e) => e + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  /* 🔌 Socket listeners */
  useEffect(() => {
    if (!socket) return;

    const handleMatchFound = (data) => {
      if (!data?.matchId || !data?.role) return;
      if (matchedRef.current) return;

      matchedRef.current = true;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      onMatched({
        matchId: data.matchId,
        role: data.role,
      });
    };

    const handleTimeout = () => {
      if (matchedRef.current) return;
      console.log("⏳ Still searching...");
    };

    socket.on("match_found", handleMatchFound);
    socket.on("match_timeout", handleTimeout);

    return () => {
      socket.off("match_found", handleMatchFound);
      socket.off("match_timeout", handleTimeout);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [socket, onMatched]);

  return (
    <div className="
      min-h-screen flex items-center justify-center
      bg-gradient-to-br from-slate-950 to-black
      text-white px-4
    ">
      <div
        className="
          w-full max-w-sm px-6 py-8
          rounded-3xl
          bg-white/5 backdrop-blur-xl
          shadow-[0_30px_80px_rgba(0,0,0,0.6)]
          text-center animate-fadeIn
        "
      >
        {/* Pulse */}
        <div className="flex justify-center mb-4">
          <span className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse" />
        </div>

        <h2 className="text-lg font-semibold">
          Finding someone{dots}
        </h2>

        <p className="mt-2 text-sm opacity-70">
          Anonymous • No profile • Leave anytime
        </p>

        {/* Progress bar */}
        <div className="mt-6 w-full h-2 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full w-1/3 bg-gradient-to-r from-indigo-500 to-sky-500 animate-loading" />
        </div>

        <p className="mt-4 text-xs opacity-60">
          ⏱️ {elapsed}s elapsed — usually under 10 seconds
        </p>

        {/* Safety reassurance */}
        <p className="mt-2 text-[11px] opacity-40">
          Please be respectful. You can disconnect anytime.
        </p>
      </div>

      {/* Animations */}
      <style>
        {`
          @keyframes loading {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(300%); }
          }
          .animate-loading {
            animation: loading 1.4s infinite ease-in-out;
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          .animate-fadeIn {
            animation: fadeIn 0.4s ease-out;
          }
        `}
      </style>
    </div>
  );
};

export default Matching;
