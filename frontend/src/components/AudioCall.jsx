import { useEffect, useRef, useState } from "react";

const CALL_DURATION = 10 * 60; // 10 minutes

const AudioCall = ({ webrtc, onEnd }) => {
  const { localStream, remoteStream, isMuted, toggleMute, connectionState } =
    webrtc;

  const [timeLeft, setTimeLeft] = useState(CALL_DURATION);

  const endedRef = useRef(false);
  const timerRef = useRef(null);

  const localAudioRef = useRef(null);
  const remoteAudioRef = useRef(null);

  /* =======================
     ATTACH AUDIO STREAMS
  ======================= */

  useEffect(() => {
    if (localStream && localAudioRef.current) {
      localAudioRef.current.srcObject = localStream;
      localAudioRef.current.muted = true;
      localAudioRef.current.play?.().catch(() => { });
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteStream && remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.play?.().catch(() => { });
    }
  }, [remoteStream]);

  /* =======================
     TIMER LOGIC (STABLE)
  ======================= */

  useEffect(() => {
    // Only start timer if fully connected and streams exist
    if (
      connectionState !== "connected" ||
      !localStream ||
      !remoteStream ||
      endedRef.current
    ) {
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          handleEnd();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [connectionState, localStream, remoteStream]);

  /* =======================
     FORCE STOP TIMER IF STREAM LOST
  ======================= */

  useEffect(() => {
    if (!localStream || !remoteStream) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [localStream, remoteStream]);

  /* =======================
     SAFE END HANDLER
  ======================= */

  const handleEnd = () => {
    if (endedRef.current) return;
    endedRef.current = true;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    onEnd?.();
  };

  const formatTime = (t) => {
    const m = Math.floor(t / 60);
    const s = t % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const isEndingSoon = timeLeft <= 60;

  return (
    <div
      className="
        fixed bottom-6 left-1/2 -translate-x-1/2
        w-[92%] max-w-sm
        bg-gradient-to-br from-black/90 to-slate-900/90
        backdrop-blur-xl
        text-white
        rounded-3xl px-6 py-5
        shadow-2xl z-[9999]
        animate-slideUp
      "
    >
      {/* AUDIO ELEMENTS */}
      <audio ref={localAudioRef} autoPlay playsInline />
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* HEADER */}
      <div className="flex items-center justify-between text-xs opacity-90">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Anonymous Voice
        </span>

        <span
          className={`tabular-nums ${isEndingSoon ? "text-red-400 font-semibold" : ""
            }`}
        >
          ⏱ {formatTime(timeLeft)}
        </span>
      </div>

      {/* VOICE VISUALIZER */}
      <div className="mt-6 flex justify-center gap-2">
        {[1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className="w-3 h-3 rounded-full bg-indigo-400 animate-voice"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>

      {/* MICRO COPY */}
      <p className="mt-4 text-center text-xs opacity-60">
        Stay respectful. 10 min max per conversation.
      </p>

      {/* CONTROLS */}
      <div className="mt-5 flex justify-center gap-4">
        <button
          onClick={toggleMute}
          className={`
            px-5 py-2 rounded-xl text-sm font-medium transition
            ${isMuted
              ? "bg-yellow-400 text-black"
              : "bg-white/10 hover:bg-white/20"
            }
          `}
        >
          {isMuted ? "🔊 Unmute" : "🔇 Mute"}
        </button>

        <button
          onClick={handleEnd}
          className="
            px-6 py-2 rounded-xl text-sm font-medium
            bg-red-500 hover:bg-red-600 transition
          "
        >
          End Call
        </button>
      </div>

      {/* ANIMATIONS */}
      <style>
        {`
          @keyframes voice {
            0% { transform: scale(0.6); opacity: 0.4; }
            50% { transform: scale(1.3); opacity: 1; }
            100% { transform: scale(0.6); opacity: 0.4; }
          }
          .animate-voice {
            animation: voice 1.4s infinite ease-in-out;
          }

          @keyframes slideUp {
            from { transform: translate(-50%, 40px); opacity: 0; }
            to { transform: translate(-50%, 0); opacity: 1; }
          }
          .animate-slideUp {
            animation: slideUp 0.35s ease-out;
          }
        `}
      </style>
    </div>
  );
};

export default AudioCall;
