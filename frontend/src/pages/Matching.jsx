import React, { useEffect, useRef, useState } from "react";

const Matching = ({ socket, onMatched, hasPremium = false }) => { // 👈 ADD hasPremium prop
  const matchedRef = useRef(false);
  const [limitReached, setLimitReached] = useState(false);

  const [dots, setDots] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);

  const messages = [
    "Finding someone real",
    "Looking for a good conversation",
    "Almost connected",
    "Matching you instantly",
  ];

  /* 🔁 Animated dots */
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length === 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  /* ⏱️ Elapsed counter */
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((e) => e + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  /* 🔄 Rotating psychological messages */
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  /* 🔌 Socket listeners - FIXED */
  useEffect(() => {
    if (!socket) return;

    const handleMatchFound = (data) => {
      if (!data?.matchId || !data?.role) return;
      if (matchedRef.current) return;

      console.log("🎯 Match found in Matching:", data);
      matchedRef.current = true;

      onMatched({
        matchId: data.matchId,
        role: data.role,
        mode: data.mode || localStorage.getItem('selectedMode') || 'chat'
      });
    };

    const handleLimit = () => {
      // 🔥 FIX: Agar premium hai to limit ignore karo
      if (hasPremium) {
        console.log("✨ Premium user - ignoring limit");
        return;
      }
      setLimitReached(true);
    };

    socket.on("match_found", handleMatchFound);
    socket.on("limit_reached", handleLimit);

    return () => {
      socket.off("match_found", handleMatchFound);
      socket.off("limit_reached", handleLimit);
    };
  }, [socket, onMatched, hasPremium]);

  /* =======================
     LIMIT SCREEN - Sirf non-premium users ke liye
  ======================= */

  if (limitReached && !hasPremium) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black to-slate-900 text-white px-4">
        <div className="bg-white/5 backdrop-blur-xl p-8 rounded-2xl text-center max-w-sm shadow-xl animate-fadeIn">
          <div className="text-4xl mb-3">🚫</div>

          <h2 className="text-xl font-semibold mb-3">
            Daily Free Limit Reached
          </h2>

          <p className="text-sm opacity-70 mb-6">
            You’ve used your 3 free conversations today.
            <br />
            Unlock unlimited matches for just ₹1.
          </p>

          <button
            className="px-6 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-500 transition shadow-md"
            onClick={() => alert("₹1 unlock coming soon")}
          >
            🔓 Unlock 24h Access (₹1)
          </button>

          <p className="mt-4 text-xs opacity-50">
            Safe • Private • Cancel anytime
          </p>
        </div>
      </div>
    );
  }

  /* =======================
     MATCHING SCREEN
  ======================= */

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 to-black text-white px-4">
      <div className="w-full max-w-sm px-6 py-8 rounded-3xl bg-white/5 backdrop-blur-xl shadow-[0_30px_80px_rgba(0,0,0,0.6)] text-center animate-fadeIn">

        {/* Pulse Indicator */}
        <div className="flex justify-center mb-4">
          <span className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse" />
        </div>

        {/* Rotating message */}
        <h2 className="text-lg font-semibold">
          {messages[messageIndex]}{dots}
        </h2>

        <p className="mt-2 text-sm opacity-70">
          Anonymous • No profile • Instant disconnect
        </p>

        {/* Loading Bar */}
        <div className="mt-6 w-full h-2 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full w-1/3 bg-gradient-to-r from-indigo-500 to-sky-500 animate-loading" />
        </div>

        {/* Elapsed */}
        <p className="mt-4 text-xs opacity-60">
          ⏱️ {elapsed}s elapsed — usually under 10 seconds
        </p>

        {/* Safety reminder */}
        <p className="mt-3 text-[11px] opacity-40">
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