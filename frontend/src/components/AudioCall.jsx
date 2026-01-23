import { useEffect, useRef, useState, useCallback } from "react";
import useWebRTC from "../hooks/useWebRTC";
import useVoiceActivity from "../hooks/useVoiceActivity";

const CALL_DURATION = 10 * 60;

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

  /* 🔄 RESET ON NEW MATCH */
  useEffect(() => {
    startedRef.current = false;
    endedRef.current = false;
    setTimeLeft(CALL_DURATION);
  }, [matchId]);

  /* ❌ END CALL (ONLY PLACE) */
  const handleEnd = useCallback(() => {
    if (endedRef.current) return;
    endedRef.current = true;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    endCall(true);
    onEnd?.();
  }, [endCall, onEnd]);

  /* ▶️ START CALL (MOUNT ONLY) */
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    startCall();
  }, [startCall]);

  /* 🔔 REMOTE CALL END */
  useEffect(() => {
    if (!socket) return;

    socket.on("call-ended", handleEnd);
    return () => socket.off("call-ended", handleEnd);
  }, [socket, handleEnd]);

  /* ⏱ TIMER (SAFE) */
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleEnd();
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

  /* 🔊 ENSURE REMOTE AUDIO PLAY */
  useEffect(() => {
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.play().catch(() => { });
    }
  }, [remoteStream]);

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-slate-950 to-black text-white">
      <div className="w-[92%] max-w-sm rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl p-6 flex flex-col items-center gap-6">

        <h2 className="text-lg font-semibold">🔊 Audio Call</h2>

        <div className="text-4xl font-extrabold text-yellow-400">
          {formatTime(timeLeft)}
        </div>

        <div
          className={`px-4 py-1 rounded-full text-sm font-medium
            ${isSpeaking
              ? "bg-green-500/20 text-green-400 animate-pulse"
              : "bg-white/10 text-gray-400"
            }`}
        >
          {isSpeaking ? "Speaking…" : "Silent"}
        </div>

        {!isMicReady && (
          <span className="text-xs text-white/60">
            Connecting microphone…
          </span>
        )}

        {localStream && (
          <audio autoPlay muted playsInline ref={(el) => el && (el.srcObject = localStream)} />
        )}

        {remoteStream && (
          <audio
            ref={remoteAudioRef}
            autoPlay
            playsInline
          />
        )}

        <div className="flex gap-6 mt-4">
          <button
            onClick={toggleMute}
            disabled={!isMicReady}
            className={`w-14 h-14 rounded-full text-xl
              ${isMicReady
                ? "bg-slate-700 hover:bg-slate-600"
                : "bg-slate-600 opacity-50"
              }`}
          >
            {isMuted ? "🔈" : "🔇"}
          </button>

          <button
            onClick={handleEnd}
            className="w-14 h-14 rounded-full text-xl bg-red-600 hover:bg-red-500"
          >
            📞
          </button>
        </div>

        <p className="text-xs text-white/40">
          Call ends automatically
        </p>
      </div>
    </div>
  );
};

export default AudioCall;
