import { useEffect, useState } from "react";

const TypingText = ({ text, speed = 70 }) => {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    let i = 0;
    setDisplayed("");
    const interval = setInterval(() => {
      setDisplayed((prev) => prev + text[i]);
      i++;
      if (i >= text.length) clearInterval(interval);
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-white/85">
      {displayed}
      <span className="animate-pulse"></span>
    </p>
  );
};

export default TypingText;
