import { useEffect, useRef, useState, useCallback } from "react";
import useWebRTC from "../hooks/useWebRTC";
import useVoiceActivity from "../hooks/useVoiceActivity";

const CALL_DURATION = 10 * 60; // 10 minutes (seconds)

const AudioCall = ({ socket, matchId, onEnd }) => {
  const {
    localStream,
    remoteStream,
    startCall,
    endCall,
    toggleMute,
    isMuted,
    isMicReady,
  } = useWebRTC(socket, matchId);

  const { isSpeaking } = useVoiceActivity(localStream);

  const [timeLeft, setTimeLeft] = useState(CALL_DURATION);

  const startedRef = useRef(false);
  const endedRef = useRef(false);
  const timerRef = useRef(null);
  const remoteAudioRef = useRef(null);

  /* ❌ END CALL — SINGLE SOURCE OF TRUTH */
  const handleEnd = useCallback(() => {
    if (endedRef.current) return;
    endedRef.current = true;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    endCall();
    onEnd?.();
  }, [endCall, onEnd]);

  /* ▶️ START CALL (ONCE ONLY) */
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    startCall();

    return () => {
      handleEnd(); // 🧹 hard cleanup on unmount
    };
  }, [startCall, handleEnd]);

  /* ⏱ TIMER */
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleEnd(); // ⛔ auto end at 0
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [handleEnd]);

  /* 🔊 FORCE REMOTE AUDIO PLAY (IMPORTANT) */
  useEffect(() => {
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current
        .play()
        .then(() => console.log("🔊 Remote audio playing"))
        .catch(() => console.warn("🔇 Autoplay blocked"));
    }
  }, [remoteStream]);

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-950 to-black text-white">
      <div className="w-[92%] max-w-sm rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl p-6 flex flex-col items-center gap-6">

        {/* 🔊 TITLE */}
        <h2 className="text-lg font-semibold tracking-wide">
          Audio Call
        </h2>

        {/* ⏱ TIMER */}
        <div className="text-4xl font-extrabold text-yellow-400">
          {formatTime(timeLeft)}
        </div>

        {/* 🎙 SPEAKING INDICATOR */}
        <div
          className={`px-4 py-1 rounded-full text-sm font-medium transition-all
            ${isSpeaking
              ? "bg-green-500/20 text-green-400 animate-pulse"
              : "bg-white/10 text-gray-400"
            }`}
        >
          {isSpeaking ? "Speaking…" : "Silent"}
        </div>

        {/* 🎤 MIC STATUS */}
        {!isMicReady && (
          <span className="text-xs text-white/60">
            Connecting microphone…
          </span>
        )}

        {/* 🎤 LOCAL AUDIO (muted) */}
        {localStream && (
          <audio
            autoPlay
            muted
            playsInline
            ref={(el) => el && (el.srcObject = localStream)}
          />
        )}

        {/* 🔊 REMOTE AUDIO */}
        <audio ref={remoteAudioRef} playsInline />

        {/* 🎛 CONTROLS */}
        <div className="flex gap-6 mt-4">
          {/* MUTE */}
          <button
            onClick={toggleMute}
            disabled={!isMicReady}
            className={`w-14 h-14 rounded-full flex items-center justify-center text-xl transition
              ${isMicReady
                ? "bg-slate-700 hover:bg-slate-600"
                : "bg-slate-600 opacity-50"
              }`}
          >
            {isMuted ? "🔈" : "🔇"}
          </button>

          {/* END */}
          <button
            onClick={handleEnd}
            className="w-14 h-14 rounded-full flex items-center justify-center text-xl bg-red-600 hover:bg-red-500"
          >
            📞
          </button>
        </div>

        {/* FOOTER */}
        <p className="text-xs text-white/40 mt-2">
          Call will end automatically
        </p>
      </div>
    </div>
  );
};

export default AudioCall;
