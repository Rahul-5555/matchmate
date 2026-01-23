import { useEffect, useRef } from "react";
import AudioCall from "../components/AudioCall";

const ChatAudioController = ({
  socket,
  matchId,
  mode,
  audioOn,
  setAudioOn,
}) => {
  const autoStartedRef = useRef(false);

  /* 🔥 AUTO START AUDIO IF MODE === audio */
  useEffect(() => {
    if (mode === "audio" && !autoStartedRef.current) {
      autoStartedRef.current = true;
      setAudioOn(true);
    }
  }, [mode, setAudioOn]);

  /* ✅ LISTEN WHEN OTHER PERSON CUTS CALL */
  useEffect(() => {
    if (!socket) return;

    const handleRemoteEnd = ({ matchId: endedMatchId }) => {
      if (endedMatchId === matchId) {
        setAudioOn(false); // 🔇 B ka audio bhi band
      }
    };

    socket.on("audio-call-ended", handleRemoteEnd);

    return () => {
      socket.off("audio-call-ended", handleRemoteEnd);
    };
  }, [socket, matchId, setAudioOn]);

  if (!audioOn) return null;

  return (
    <AudioCall
      socket={socket}
      matchId={matchId}
      onEnd={() => {
        setAudioOn(false); // 🔊 sirf local
        socket.emit("audio-call-ended", { matchId }); // 🔥 notify other
      }}
    />
  );
};

export default ChatAudioController;
