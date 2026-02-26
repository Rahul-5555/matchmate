import { useEffect, useRef } from "react";
import AudioCall from "../components/AudioCall";

const ChatAudioController = ({
  audioOn,
  setAudioOn,
  isCaller,
  webrtc,
  onEndCall,
}) => {

  const startedRef = useRef(false);
  const endingRef = useRef(false);
  const audioOnRef = useRef(audioOn);

  const { startCall, connectionState } = webrtc;

  /* =======================
     TRACK AUDIOON CHANGES
  ======================= */

  useEffect(() => {
    audioOnRef.current = audioOn;
    console.log("🎧 AudioOn changed:", audioOn, "isCaller:", isCaller);
  }, [audioOn, isCaller]);

  /* =======================
     AUTO START (CALLER ONLY)
  ======================= */

  useEffect(() => {
    if (!audioOn) {
      console.log("⏸️ Audio off, not starting call");
      return;
    }

    if (!isCaller) {
      console.log("⏳ Not caller, waiting for offer...");
      return;
    }

    if (startedRef.current) {
      console.log("⚠️ Call already started");
      return;
    }

    const timer = setTimeout(() => {
      if (!audioOnRef.current) {
        console.log("⏸️ Audio turned off during delay, aborting start");
        return;
      }

      if (startedRef.current) {
        console.log("⚠️ Call already started (double-check)");
        return;
      }

      console.log("📞 Starting call as caller...");
      startedRef.current = true;

      setTimeout(() => {
        startCall();
      }, 100);

    }, 800);

    return () => clearTimeout(timer);
  }, [audioOn, isCaller, startCall]);

  /* =======================
     MONITOR CONNECTION STATE
  ======================= */

  useEffect(() => {
    console.log("🔌 WebRTC Connection State:", connectionState);

    if (connectionState === "failed" && !endingRef.current && audioOn) {
      console.log("❌ Connection failed, ending call");
      handleEnd("connection_failed");
    }

    if (connectionState === "connected") {
      console.log("✅ WebRTC connected successfully!");
    }

  }, [connectionState, audioOn]);

  /* =======================
     RESET WHEN AUDIO OFF
  ======================= */

  useEffect(() => {
    if (!audioOn) {
      console.log("🔄 Resetting audio controller");
      startedRef.current = false;
      endingRef.current = false;
    }
  }, [audioOn]);

  /* =======================
     SAFE END HANDLER
  ======================= */

  const handleEnd = (reason = "user_ended") => {
    if (endingRef.current) {
      console.log("🔚 Already ending call");
      return;
    }

    console.log("🔚 Ending call, reason:", reason);
    endingRef.current = true;
    startedRef.current = false;

    if (onEndCall) {
      onEndCall(reason);
    }

    setTimeout(() => {
      setAudioOn(false);
    }, 100);
  };

  if (!audioOn) return null;

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-black text-white p-6">
      <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 w-full max-w-md border border-white/10 shadow-2xl">

        {/* Header - REMOVED timer from here */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <div className="text-7xl mb-4 animate-pulse">🎧</div>
            <div className="absolute -top-1 -right-1 w-4 h-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500"></span>
            </div>
          </div>

          <div className="text-2xl font-bold mb-2">Voice Connected</div>

          {/* Connection State - REMOVED timer */}
          <div className="flex justify-center">
            <div className={`px-3 py-1 rounded-full ${connectionState === "connected" ? "bg-green-500/20 text-green-400" :
              connectionState === "connecting" ? "bg-yellow-500/20 text-yellow-400" :
                connectionState === "failed" ? "bg-red-500/20 text-red-400" :
                  "bg-slate-500/20 text-slate-400"
              }`}>
              {connectionState === "connected" ? "● Connected" :
                connectionState === "connecting" ? "⟳ Connecting..." :
                  connectionState === "failed" ? "✗ Failed" :
                    connectionState === "disconnected" ? "⚠ Disconnected" :
                      connectionState || "Idle"}
            </div>
          </div>
        </div>

        {/* Audio Call Component - Timer will show here */}
        <AudioCall
          webrtc={webrtc}
          onEnd={() => handleEnd("user_ended")}
        />

        <div className="mt-8 text-center">
          <div className="text-xs text-slate-500 space-y-2">
            <p>🔒 End-to-end encrypted • 100% anonymous</p>
            <p className="text-yellow-500/60">Stay respectful. You can end anytime.</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ChatAudioController;