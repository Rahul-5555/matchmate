import React from 'react';
import StatBar from '../StatBar';
// import heroImg from "../../assets/heroimg.png";

const HeroSection = ({
  socket,
  calculatedStatus,
  onStartTextChat,
  onStartVoiceChat
}) => {
  return (
    <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
      <div className="space-y-8 md:pr-8 order-2 md:order-1">
        <h1 className="text-4xl sm:text-5xl font-bold leading-tight tracking-tight">
          Meet new people.
          <br />
          <span className="text-indigo-600 dark:text-indigo-400">
            Instantly.
          </span>
        </h1>

        <p className="text-lg text-slate-600 dark:text-slate-300 max-w-md">
          Anonymous conversations. Real humans. Zero pressure.
          Just tap and start talking.
        </p>

        <StatBar socket={socket} status={calculatedStatus} />

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 w-full">
          <button
            onClick={onStartTextChat}
            className="w-full sm:w-auto px-8 py-3 rounded-lg text-sm font-medium text-white 
               bg-indigo-600 hover:bg-indigo-500
               transition-all duration-300
               shadow-md hover:shadow-xl hover:-translate-y-1
               flex items-center justify-center gap-2"
          >
            <span>💬</span>
            <span>Start Text Chat</span>
          </button>

          <button
            onClick={onStartVoiceChat}
            className="w-full sm:w-auto px-8 py-3 rounded-lg text-sm font-medium text-white 
               bg-indigo-600 hover:bg-indigo-500
               transition-all duration-300
               shadow-md hover:shadow-xl hover:-translate-y-1
               flex items-center justify-center gap-2"
          >
            <span>🎧</span>
            <span>Start Voice Call</span>
          </button>
        </div>
      </div>

      <div className="flex justify-center order-1 md:order-2">
        <div className="w-full max-w-md md:max-w-lg rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <img
            alt="hero"
            src="/Heroimg.png"
            className="w-full h-auto object-contain"
          />
        </div>
      </div>
    </div>
  );
};

export default HeroSection;