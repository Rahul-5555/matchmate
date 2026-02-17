import React from "react";

const interests = [
  { label: "Tech", value: "tech", emoji: "💻" },
  { label: "Study", value: "study", emoji: "📚" },
  { label: "Gaming", value: "gaming", emoji: "🎮" },
  { label: "Startup", value: "startup", emoji: "🚀" },
  { label: "Dating", value: "dating", emoji: "❤️" },
  { label: "Random", value: "global", emoji: "🌍" },
];

const InterestModal = ({
  isOpen,
  selectedInterest,
  setSelectedInterest,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">

      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl w-full max-w-md shadow-xl animate-fadeIn">

        <h2 className="text-xl font-semibold mb-5 text-center text-slate-900 dark:text-white">
          Choose a topic
        </h2>

        <div className="grid grid-cols-2 gap-3">
          {interests.map((item) => (
            <button
              key={item.value}
              onClick={() => setSelectedInterest(item.value)}
              className={`flex flex-col items-center justify-center py-4 rounded-xl transition-all duration-200
                ${selectedInterest === item.value
                  ? "bg-indigo-600 text-white scale-105"
                  : "bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700"
                }`}
            >
              <span className="text-xl">{item.emoji}</span>
              <span className="mt-1 text-sm font-medium">
                {item.label}
              </span>
            </button>
          ))}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="flex-1 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition"
          >
            Start
          </button>
        </div>

      </div>
    </div>
  );
};

export default InterestModal;
