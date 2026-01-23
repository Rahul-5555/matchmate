import React from "react";

const Header = () => {
  return (
    <div className="mt-4 text-center">
      {/* LOGO / TITLE */}
      <h1
        className="
          text-2xl sm:text-3xl
          font-extrabold
          tracking-wide
          text-slate-900
          dark:text-white
        "
      >
        ♟ MatchMate
      </h1>

      {/* TAGLINE */}
      <p
        className="
          mt-2
          text-sm
          text-slate-600
          dark:text-white/70
          tracking-wide
        "
      >
        Connect. Talk. Disconnect.
      </p>
    </div>
  );
};

export default Header;
