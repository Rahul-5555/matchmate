import React from "react";

const Header = () => {
  return (
    <header className="mt-6 text-center select-none">
      {/* LOGO / TITLE */}
      <h1
        className="
          text-3xl sm:text-4xl
          font-extrabold
          tracking-tight
          text-slate-800 dark:text-white
        "
      >
        ♟ MatchMate
      </h1>

      {/* TAGLINE */}
      <p
        className="
          mt-2
          text-sm sm:text-base
          text-slate-600 dark:text-white/70
          tracking-wide
          animate-fade-in-delayed
        "
      >
        Connect. Talk. Disconnect.
      </p>
    </header>
  );
};

export default Header;
