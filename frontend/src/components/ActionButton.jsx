import React from "react";

const ActionButton = ({
  text,
  onClick,
  disabled = false,
  fullWidth = true,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${fullWidth ? "w-full" : "w-auto"}
        px-5 py-4
        rounded-2xl
        font-semibold
        text-white
        text-base
        bg-gradient-to-br from-blue-600 to-blue-800
        shadow-md
        transition-all duration-150
        active:scale-95
        hover:brightness-110
        focus:outline-none
        focus:ring-2 focus:ring-blue-400 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
    >
      {text}
    </button>
  );
};

export default ActionButton;
