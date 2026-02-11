import React, { memo, useRef, useState } from "react";

const REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "😡"];
const LONG_PRESS_TIME = 400;

const MessageBubble = memo(({ m, onReact }) => {
  const [showReactions, setShowReactions] = useState(false);
  const longPressTimer = useRef(null);

  const reactions = m.reactions?.counts || {};
  const myReaction = m.reactions?.myReaction || null;

  /* 📱 Long press for mobile */
  const handleTouchStart = () => {
    longPressTimer.current = setTimeout(() => {
      setShowReactions(true);
    }, LONG_PRESS_TIME);
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  return (
    <div
      className={`
        relative group max-w-[85%] sm:max-w-[70%]
        px-4 py-2 rounded-2xl text-[15px] sm:text-sm
        shadow-sm transition-all duration-200
        animate-fadeIn
        ${m.from === "me"
          ? "ml-auto bg-indigo-600 text-white rounded-br-sm"
          : "mr-auto bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-sm border border-slate-200 dark:border-slate-700"
        }
      `}
      onMouseEnter={() => setShowReactions(true)}
      onMouseLeave={() => setShowReactions(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={cancelLongPress}
      onTouchMove={cancelLongPress}
    >
      {/* MESSAGE TEXT */}
      <div className="break-words leading-relaxed">
        {m.text}
      </div>

      {/* STATUS (only for me) */}
      {m.from === "me" && (
        <div className="text-[10px] text-right opacity-70 mt-1 flex justify-end gap-1">
          {m.status === "sent" && <span>✔</span>}
          {m.status === "delivered" && <span>✔✔</span>}
          {m.status === "seen" && <span className="text-blue-400">✔✔</span>}
        </div>
      )}

      {/* 😀 REACTION PICKER */}
      {showReactions && (
        <div
          className="
            absolute -top-11 left-2
            flex gap-2 px-3 py-1.5
            bg-white dark:bg-slate-700
            rounded-full shadow-xl
            text-lg z-20
            animate-pop
          "
        >
          {REACTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                onReact?.(m.id, emoji);
                setShowReactions(false);
              }}
              className="active:scale-125 hover:scale-110 transition"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* REACTION COUNTS */}
      {Object.keys(reactions).length > 0 && (
        <div className="flex gap-1 mt-1 text-xs flex-wrap">
          {Object.entries(reactions).map(([emoji, count]) => (
            <span
              key={emoji}
              className={`
                px-2 py-[3px] rounded-full flex items-center gap-1
                ${myReaction === emoji
                  ? "bg-indigo-500 text-white"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                }
              `}
            >
              {emoji} {count}
            </span>
          ))}
        </div>
      )}

      {/* MICRO ANIMATIONS */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(6px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fadeIn {
            animation: fadeIn 0.2s ease-out;
          }

          @keyframes pop {
            from { transform: scale(0.9); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
          .animate-pop {
            animation: pop 0.15s ease-out;
          }
        `}
      </style>
    </div>
  );
});

export default MessageBubble;
