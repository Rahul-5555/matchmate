import React from 'react';

const FeatureCards = () => {
  const features = [
    {
      icon: "🔒",
      title: "100% Anonymous",
      description: "No accounts. No tracking. No saved history. Just honest conversations."
    },
    {
      icon: "⚡",
      title: "Instant Matching",
      description: "Connect with someone new in seconds. No waiting. No setup."
    },
    {
      icon: "🎧",
      title: "Real Conversations",
      description: "Choose text or voice. Talk freely and naturally."
    }
  ];

  return (
    <>
      <div className="text-center mb-16">
        <h3 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Why people love MatchMate
        </h3>
        <p className="mt-4 text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
          Designed for meaningful conversations without pressure.
          Simple, fast and completely anonymous.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
        {features.map((feature, index) => (
          <div
            key={index}
            className="group p-8 rounded-2xl bg-white dark:bg-gray-900 
                     border border-gray-200 dark:border-gray-800 
                     transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 
                     text-center shadow-sm dark:shadow-none"
          >
            <div className="w-14 h-14 mx-auto flex items-center justify-center 
                        rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-2xl mb-6">
              {feature.icon}
            </div>
            <h4 className="font-semibold text-lg mb-3 text-gray-900 dark:text-white">
              {feature.title}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-xs mx-auto">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </>
  );
};

export default FeatureCards;