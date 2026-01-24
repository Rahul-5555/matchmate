import { useEffect, useRef, useState } from "react";

const CALL_DURATION = 10 * 60;

const AudioCall = ({ webrtc, onEnd }) => {
  const { localStream, remoteStream, isMuted, toggleMute } = webrtc;

  const [timeLeft, setTimeLeft] = useState(CALL_DURATION);
  const endedRef = useRef(false);
  const shouldEndRef = useRef(false);

  const localAudioRef = useRef(null);
  const remoteAudioRef = useRef(null);

  /* 🔊 Attach audio streams */
  useEffect(() => {
    if (localStream && localAudioRef.current) {
      localAudioRef.current.srcObject = localStream;
      localAudioRef.current.muted = true;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteStream && remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  /* ⏱ Timer (safe) */
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          shouldEndRef.current = true;
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  /* 🛑 End after render */
  useEffect(() => {
    if (shouldEndRef.current && !endedRef.current) {
      endedRef.current = true;
      onEnd?.();
    }
  });

  const formatTime = (t) => {
    const m = Math.floor(t / 60);
    const s = t % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-sm bg-black/80 backdrop-blur-xl text-white rounded-3xl px-5 py-4 shadow-2xl z-[9999]">
      {/* AUDIO */}
      <audio ref={localAudioRef} autoPlay />
      <audio ref={remoteAudioRef} autoPlay />

      {/* STATUS */}
      <div className="flex items-center justify-between text-xs opacity-80">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Connected • Anonymous
        </span>
        <span>⏱ {formatTime(timeLeft)}</span>
      </div>

      {/* VOICE PULSE */}
      <div className="mt-5 flex justify-center gap-2">
        {[1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className="w-3 h-3 rounded-full bg-indigo-400 animate-voice"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>

      {/* MICRO COPY */}
      <p className="mt-4 text-center text-xs opacity-70">
        You’re anonymous. Say hi 👋
      </p>

      {/* CONTROLS */}
      <div className="mt-4 flex justify-center gap-4">
        <button
          onClick={toggleMute}
          className={`px-5 py-2 rounded-xl text-sm transition ${isMuted
            ? "bg-yellow-500 text-black"
            : "bg-white/10 hover:bg-white/20"
            }`}
        >
          {isMuted ? "Unmute" : "Mute"}
        </button>

        <button
          onClick={() => {
            if (endedRef.current) return;
            endedRef.current = true;
            onEnd?.();
          }}
          className="px-6 py-2 rounded-xl text-sm bg-red-500 hover:bg-red-600"
        >
          End Call
        </button>
      </div>

      {/* ANIMATION */}
      <style>
        {`
          @keyframes voice {
            0% { transform: scale(0.6); opacity: 0.4; }
            50% { transform: scale(1.2); opacity: 1; }
            100% { transform: scale(0.6); opacity: 0.4; }
          }
          .animate-voice {
            animation: voice 1.4s infinite ease-in-out;
          }
        `}
      </style>
    </div>
  );
};

export default AudioCall;
