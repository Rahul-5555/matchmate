import React, { useEffect, useState } from "react";

const MatchFound = ({ onContinue }) => {
  const [countdown, setCountdown] = useState(3);

  /* ⏱ Auto continue after 3 sec */
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          onContinue();
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onContinue]);

  return (
    <div
      className="min-h-screen flex items-center justify-center
                 bg-gradient-to-br from-slate-950 to-black text-white"
    >
      <div
        className="text-center px-6 py-10 rounded-3xl
                   bg-white/5 backdrop-blur-xl
                   shadow-[0_30px_80px_rgba(0,0,0,0.6)]
                   animate-scaleIn"
      >
        {/* STATUS DOT */}
        <div className="flex justify-center mb-4">
          <span className="w-4 h-4 rounded-full bg-green-500 animate-pulse" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold mb-2">
          🎉 Match Found
        </h1>

        <p className="text-sm opacity-70 mb-6">
          You’re now connected to someone anonymous
        </p>

        {/* COUNTDOWN */}
        <p className="text-xs opacity-60 mb-4">
          Starting in <span className="font-semibold">{countdown}</span>…
        </p>

        {/* CTA */}
        <button
          onClick={onContinue}
          className="
            px-8 py-3 rounded-xl text-sm font-semibold
            bg-gradient-to-r from-emerald-500 to-green-600
            hover:from-emerald-400 hover:to-green-500
            transition-all active:scale-95
          "
        >
          Start Chat 💬
        </button>
      </div>

      {/* Animations */}
      <style>
        {`
          @keyframes scaleIn {
            0% {
              opacity: 0;
              transform: scale(0.85);
            }
            100% {
              opacity: 1;
              transform: scale(1);
            }
          }
          .animate-scaleIn {
            animation: scaleIn 0.45s ease-out;
          }
        `}
      </style>
    </div>
  );
};

export default MatchFound;
