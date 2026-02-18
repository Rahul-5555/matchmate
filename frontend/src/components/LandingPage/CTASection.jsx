import React from 'react';

const CTASection = ({ onStartTextChat, onStartVoiceChat }) => {
  return (
    <div className="py-16 px-4">
      <div className="max-w-4xl mx-auto text-center">
        {/* Heading */}
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
          Ready to Meet New People?
        </h2>

        {/* Description */}
        <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-2xl mx-auto">
          Join thousands of users already having meaningful conversations.
          It's free, anonymous, and takes just seconds to start.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <button
            onClick={onStartTextChat}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium
                       hover:bg-indigo-500 transition-colors duration-200
                       flex items-center justify-center gap-2"
          >
            <span>💬</span>
            <span>Start Text Chat</span>
          </button>

          <button
            onClick={onStartVoiceChat}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium
                       hover:bg-purple-500 transition-colors duration-200
                       flex items-center justify-center gap-2"
          >
            <span>🎧</span>
            <span>Start Voice Call</span>
          </button>
        </div>

        {/* Trust Indicators - Simple Row */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔒</span>
            <span>100% Anonymous</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
          <div className="flex items-center gap-2">
            <span className="text-lg">⚡</span>
            <span>Instant Matching</span>
          </div>
          <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
          <div className="flex items-center gap-2">
            <span className="text-lg">🎧</span>
            <span>Free Voice Calls</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CTASection;