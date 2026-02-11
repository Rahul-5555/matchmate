import { useEffect, useRef, useState } from "react";
import AudioCall from "../components/AudioCall";

const ChatAudioController = ({
  audioOn,
  setAudioOn,
  isCaller,
  webrtc,
}) => {

  const startedRef = useRef(false);
  const endingRef = useRef(false);

  const { startCall, endCall } = webrtc;

  const [callSeconds, setCallSeconds] = useState(0);

  /* =======================
     CALL TIMER
  ======================= */

  useEffect(() => {
    if (!audioOn) return;

    const timer = setInterval(() => {
      setCallSeconds((s) => s + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [audioOn]);

  const formatTime = () => {
    const m = Math.floor(callSeconds / 60);
    const s = callSeconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  /* =======================
     AUTO START (CALLER ONLY)
  ======================= */

  useEffect(() => {
    if (!audioOn) return;
    if (!isCaller) return;
    if (startedRef.current) return;

    startedRef.current = true;
    startCall();
  }, [audioOn, isCaller, startCall]);

  /* =======================
     RESET WHEN AUDIO OFF
  ======================= */

  useEffect(() => {
    if (!audioOn) {
      startedRef.current = false;
      endingRef.current = false;
      setCallSeconds(0);
    }
  }, [audioOn]);

  /* =======================
     SAFE END HANDLER
  ======================= */

  const handleEnd = () => {
    if (endingRef.current) return;
    endingRef.current = true;

    endCall(true); // notify server
    setAudioOn(false);
  };

  if (!audioOn) return null;

  return (
    <div className="flex flex-col items-center justify-center flex-1 bg-gradient-to-br from-slate-950 to-black text-white">

      {/* Call Status */}
      <div className="text-center mb-6">
        <div className="text-green-400 text-sm mb-1">
          🔊 Voice Connected
        </div>
        <div className="text-xs opacity-70">
          ⏱ {formatTime()}
        </div>
      </div>

      {/* Main Audio UI */}
      <AudioCall
        webrtc={webrtc}
        onEnd={handleEnd}
      />

      {/* Safety Note */}
      <div className="mt-6 text-xs opacity-40">
        Stay respectful. You can end anytime.
      </div>
    </div>
  );
};

export default ChatAudioController;
