import { useEffect, useRef } from "react";
import AudioCall from "../components/AudioCall";

const ChatAudioController = ({
  audioOn,
  setAudioOn,
  isCaller,
  webrtc, // injected from Chat.jsx
}) => {
  const startedRef = useRef(false);
  const endingRef = useRef(false); // 🔥 prevents double end

  const { startCall, endCall } = webrtc;

  /* =======================
     AUTO START (CALLER ONLY)
  ======================= */
  useEffect(() => {
    if (!audioOn) return;
    if (!isCaller) return;
    if (startedRef.current) return;

    startedRef.current = true;
    startCall();

    // console.log("🎧 Audio call started (caller)");
  }, [audioOn, isCaller, startCall]);

  /* =======================
     RESET WHEN AUDIO OFF
  ======================= */
  useEffect(() => {
    if (!audioOn) {
      startedRef.current = false;
      endingRef.current = false;
    }
  }, [audioOn]);

  /* =======================
     SAFE END HANDLER
  ======================= */
  const handleEnd = () => {
    if (endingRef.current) return;
    endingRef.current = true;

    endCall(true);       // 🔥 emits audio:end (server aware)
    setAudioOn(false);   // UI + state sync
  };

  if (!audioOn) return null;

  return (
    <AudioCall
      webrtc={webrtc}
      onEnd={handleEnd}
    />
  );
};

export default ChatAudioController;
