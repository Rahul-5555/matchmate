import React from 'react';
import StatBar from '../StatBar';
// import heroImg from "../../assets/heroimg.png";
import { motion } from "framer-motion";

const HeroSection = ({
  socket,
  calculatedStatus,
  onStartTextChat,
  onStartVoiceChat
}) => {
  return (
    <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16 items-center">
      {/* Left Content */}
      <div className="space-y-6 md:pr-8 order-2 md:order-1">
        {/* Heading */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
          <span className="text-gray-900 dark:text-white">Meet new people.</span>
          <br />
          <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Instantly.
          </span>
        </h1>

        {/* Description */}
        <p className="text-lg text-gray-700 dark:text-gray-300 max-w-md leading-relaxed">
          Anonymous conversations. Real humans. Zero pressure.
          Just tap and start talking.
        </p>

        {/* Stats Bar */}
        <div className="py-2">
          <StatBar socket={socket} status={calculatedStatus} />
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full px-4 mx-auto max-w-2xl">
          {/* Text Chat Button */}
          <button
            onClick={onStartTextChat}
            className="w-full sm:w-auto min-w-[200px] md:min-w-[220px] lg:min-w-[240px]
               px-6 md:px-8 py-3 md:py-3.5 
               rounded-xl text-sm md:text-base font-semibold 
               text-white bg-gradient-to-r from-indigo-600 to-indigo-700 
               hover:from-indigo-500 hover:to-indigo-600
               transition-all duration-300 shadow-lg hover:shadow-xl
               hover:-translate-y-1 active:translate-y-0
               flex items-center justify-center gap-2 md:gap-3"
          >
            <span className="text-lg md:text-xl group-hover:scale-110 transition-transform">💬</span>
            <span>Start Text Chat</span>
          </button>

          {/* Voice Call Button */}
          <button
            onClick={onStartVoiceChat}
            className="w-full sm:w-auto min-w-[200px] md:min-w-[220px] lg:min-w-[240px]
               px-6 md:px-8 py-3 md:py-3.5 
               rounded-xl text-sm md:text-base font-semibold 
               text-white bg-gradient-to-r from-purple-600 to-purple-700 
               hover:from-purple-500 hover:to-purple-600
               transition-all duration-300 shadow-lg hover:shadow-xl
               hover:-translate-y-1 active:translate-y-0
               flex items-center justify-center gap-2 md:gap-3"
          >
            <span className="text-lg md:text-xl group-hover:scale-110 transition-transform">🎧</span>
            <span>Start Voice Call</span>
          </button>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-4">
          {/* No Login */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full 
                  bg-gradient-to-r from-green-50 to-emerald-50 
                  dark:from-green-500/10 dark:to-emerald-500/10
                  border border-green-200 dark:border-green-800/50
                  shadow-sm hover:shadow-md transition-all
                  hover:scale-105 cursor-default">
            <span className="text-green-500 dark:text-green-400 text-lg">✓</span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              No login
            </span>
          </div>

          {/* Separator */}
          <div className="hidden sm:block w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />

          {/* 10 Min Timer */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full 
                  bg-gradient-to-r from-blue-50 to-cyan-50 
                  dark:from-blue-500/10 dark:to-cyan-500/10
                  border border-blue-200 dark:border-blue-800/50
                  shadow-sm hover:shadow-md transition-all
                  hover:scale-105 cursor-default">
            <span className="text-blue-500 dark:text-blue-400 text-lg">⏱️</span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              10 min timer
            </span>
          </div>

          {/* Separator */}
          <div className="hidden sm:block w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />

          {/* 100% Anonymous */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full 
                  bg-gradient-to-r from-purple-50 to-pink-50 
                  dark:from-purple-500/10 dark:to-pink-500/10
                  border border-purple-200 dark:border-purple-800/50
                  shadow-sm hover:shadow-md transition-all
                  hover:scale-105 cursor-default">
            <span className="text-purple-500 dark:text-purple-400 text-lg">🔒</span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              100% anonymous
            </span>
          </div>
        </div>
      </div>

      {/* Right Image */}
      <div className="flex justify-center order-1 md:order-2">
        <div className="relative w-full max-w-md md:max-w-lg">
          {/* Decorative elements */}
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl" />

          {/* Image Card */}
          <div className="relative rounded-2xl overflow-hidden shadow-2xl 
                      border border-gray-200 dark:border-gray-800 
                      bg-white dark:bg-gray-900
                      transform hover:scale-105 transition-transform duration-500">
            <img
              alt="hero"
              src="/Heroimg.png"
              className="w-full h-auto object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;