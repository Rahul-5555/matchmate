import React from 'react';

const CTASection = ({ onStartTextChat, onStartVoiceChat }) => {
  return (
    <div className="py-20 px-4 bg-gradient-to-b from-white to-indigo-50/30 dark:from-gray-950 dark:to-gray-900">
      <div className="max-w-4xl mx-auto text-center">
        {/* Heading */}
        <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
          Ready to Meet
          <span className="text-indigo-600 dark:text-indigo-400"> New People</span>?
        </h2>

        {/* Description */}
        <p className="text-lg text-gray-700 dark:text-gray-300 mb-10 max-w-2xl mx-auto">
          Join thousands of users already having meaningful conversations.
          It's free, anonymous, and takes just seconds to start.
        </p>

        {/* Buttons - Improved design */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-2xl mx-auto px-4">
          {/* Text Chat Button */}
          <button
            onClick={onStartTextChat}
            className="w-full sm:w-auto min-w-[240px] px-8 py-4 
               bg-gradient-to-r from-indigo-600 to-indigo-700 
               text-white rounded-xl font-semibold text-lg
               hover:from-indigo-500 hover:to-indigo-600 
               transition-all duration-300 shadow-lg hover:shadow-xl
               flex items-center justify-center gap-3
               hover:-translate-y-1 active:translate-y-0
               focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <span className="text-2xl group-hover:scale-110 transition-transform">💬</span>
            <span>Start Text Chat</span>
          </button>

          {/* Voice Call Button */}
          <button
            onClick={onStartVoiceChat}
            className="w-full sm:w-auto min-w-[240px] px-8 py-4 
               bg-gradient-to-r from-purple-600 to-purple-700 
               text-white rounded-xl font-semibold text-lg
               hover:from-purple-500 hover:to-purple-600 
               transition-all duration-300 shadow-lg hover:shadow-xl
               flex items-center justify-center gap-3
               hover:-translate-y-1 active:translate-y-0
               focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            <span className="text-2xl group-hover:scale-110 transition-transform">🎧</span>
            <span>Start Voice Call</span>
          </button>
        </div>

        {/* Trust Indicators - Enhanced */}
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8">
          <div className="flex items-center gap-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm 
                      px-4 py-2 rounded-full shadow-sm border border-gray-200 dark:border-gray-800">
            <span className="text-xl">🔒</span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              100% Anonymous
            </span>
          </div>

          <div className="flex items-center gap-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm 
                      px-4 py-2 rounded-full shadow-sm border border-gray-200 dark:border-gray-800">
            <span className="text-xl">⚡</span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Instant Matching
            </span>
          </div>

          <div className="flex items-center gap-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm 
                      px-4 py-2 rounded-full shadow-sm border border-gray-200 dark:border-gray-800">
            <span className="text-xl">🎧</span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Free Voice Calls
            </span>
          </div>
        </div>

        {/* Optional: Stats Counter */}
        <div className="mt-12 flex justify-center gap-8">
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">10K+</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Daily Users</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">50K+</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Conversations</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">4.9★</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">User Rating</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CTASection;