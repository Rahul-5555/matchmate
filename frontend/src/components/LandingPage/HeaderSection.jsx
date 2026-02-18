import React from 'react';
import ThemeToggle from '../ThemeToggle';

const HeaderSection = () => {
  return (
    <>
      <div className="absolute top-6 left-6 z-50">
        <span className="text-lg font-semibold text-slate-900 dark:text-white">
          ♟ MatchMate
        </span>
      </div>

      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>
    </>
  );
};

export default HeaderSection;