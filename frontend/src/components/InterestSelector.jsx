import React, { useState } from "react";

const interests = [
  "tech",
  "study",
  "gaming",
  "startup",
  "dating",
  "global",
];

const InterestSelector = ({ socket, onMatchStart }) => {
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSelect = (interest) => {
    setSelected(interest);
  };

  const handleFindMatch = () => {
    if (!selected) return;

    setLoading(true);

    socket.emit("find_match", { interest: selected });

    onMatchStart(selected);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-white px-4">
      <div className="w-full max-w-md bg-slate-900 p-6 rounded-2xl shadow-xl">
        <h2 className="text-2xl font-bold text-center mb-6">
          What do you want to talk about?
        </h2>

        <div className="grid grid-cols-2 gap-3">
          {interests.map((interest) => (
            <button
              key={interest}
              onClick={() => handleSelect(interest)}
              className={`py-3 rounded-xl capitalize transition-all duration-200
                ${selected === interest
                  ? "bg-indigo-600 scale-105"
                  : "bg-slate-700 hover:bg-slate-600"
                }`}
            >
              {interest}
            </button>
          ))}
        </div>

        <button
          onClick={handleFindMatch}
          disabled={!selected || loading}
          className="mt-6 w-full bg-green-600 hover:bg-green-500 py-3 rounded-xl font-semibold transition-all disabled:opacity-50"
        >
          {loading ? "Finding match..." : "Start Matching"}
        </button>
      </div>
    </div>
  );
};

export default InterestSelector;
