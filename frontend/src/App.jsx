import { useEffect, useState } from "react";
import Home from "./pages/Home.jsx";

function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1600); // ⏱️ sweet spot (not annoying, not rushed)

    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return (
      <div className="
        min-h-screen flex items-center justify-center
        bg-slate-950 text-white
      ">
        <div className="flex flex-col items-center gap-4 animate-fadeIn">

          {/* LOGO */}
          <div className="text-3xl font-extrabold tracking-wide">
            ♟ MatchMate
          </div>

          {/* SUBTEXT */}
          <div className="text-sm text-white/60">
            Connecting anonymously…
          </div>

          {/* LOADER */}
          <div className="mt-2 flex gap-1">
            <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce [animation-delay:-0.2s]" />
            <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce [animation-delay:-0.1s]" />
            <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce" />
          </div>
        </div>

        {/* FADE IN ANIMATION */}
        <style>
          {`
            @keyframes fadeIn {
              from {
                opacity: 0;
                transform: translateY(6px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            .animate-fadeIn {
              animation: fadeIn 0.45s ease-out;
            }
          `}
        </style>
      </div>
    );
  }

  return <Home />;
}

export default App;
