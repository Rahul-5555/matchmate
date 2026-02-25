import React from 'react';

const LoadingSpinner = ({ size = 'md', text = 'Loading...' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`${sizes[size]} border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin`} />
      {text && <p className="text-sm text-slate-500 dark:text-slate-400">{text}</p>}
    </div>
  );
};

export const FullPageLoader = ({ text }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 to-black">
    <LoadingSpinner size="xl" text={text} />
  </div>
);

export default LoadingSpinner;