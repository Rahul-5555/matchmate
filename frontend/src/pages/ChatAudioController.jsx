import { useEffect, useRef } from "react";
import AudioCall from "../components/AudioCall";

const ChatAudioController = ({
  audioOn,
  setAudioOn,
  isCaller,
  webrtc,        // 👈 injected from Chat.jsx
}) => {
  const startedRef = useRef(false);

  const { startCall, endCall } = webrtc;

  /* ▶️ AUTO START AUDIO (CALLER ONLY) */
  useEffect(() => {
    if (!audioOn) return;
    if (!isCaller) return;
    if (startedRef.current) return;

    startedRef.current = true;
    startCall();
  }, [audioOn, isCaller, startCall]);

  /* 🧹 RESET WHEN AUDIO OFF */
  useEffect(() => {
    if (!audioOn) {
      startedRef.current = false;
    }
  }, [audioOn]);

  if (!audioOn) return null;

  return (
    <AudioCall
      webrtc={webrtc}
      onEnd={() => {
        endCall(true);   // 🔥 emits audio:end
        setAudioOn(false);
        startedRef.current = false;
      }}
    />
  );
};

export default ChatAudioController;
