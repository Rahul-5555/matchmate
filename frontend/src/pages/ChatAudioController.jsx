import { useEffect, useRef, useState } from "react";
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

  const { startCall, connectionState, resetCall } = webrtc;

  const [callSeconds, setCallSeconds] = useState(0);

  /* =======================
     TRACK AUDIOON CHANGES
  ======================= */

  useEffect(() => {
    audioOnRef.current = audioOn;
    console.log("🎧 AudioOn changed:", audioOn, "isCaller:", isCaller);
  }, [audioOn, isCaller]);

  /* =======================
     RESET WEBRTC WHEN AUDIOON BECOMES TRUE
  ======================= */

  /* =======================
   RESET WEBRTC WHEN AUDIOON BECOMES TRUE - FIXED
======================= */

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
     AUTO START (CALLER ONLY) - FIXED
  ======================= */

  useEffect(() => {
    // Agar audio off hai to kuch mat karo
    if (!audioOn) {
      console.log("⏸️ Audio off, not starting call");
      return;
    }

    // Agar caller nahi hai to wait karo
    if (!isCaller) {
      console.log("⏳ Not caller, waiting for offer...");
      return;
    }

    // Agar already start ho chuka hai to return
    if (startedRef.current) {
      console.log("⚠️ Call already started");
      return;
    }

    // 🔥 FIX: Clear any existing timeouts
    const timer = setTimeout(() => {
      // Double-check audio still on
      if (!audioOnRef.current) {
        console.log("⏸️ Audio turned off during delay, aborting start");
        return;
      }

      // Double-check not already started
      if (startedRef.current) {
        console.log("⚠️ Call already started (double-check)");
        return;
      }

      console.log("📞 Starting call as caller...");
      startedRef.current = true;

      // Small delay to ensure everything is ready
      setTimeout(() => {
        startCall();
      }, 100);

    }, 800); // 🔥 Increased from 500ms to 800ms

    return () => clearTimeout(timer);
  }, [audioOn, isCaller, startCall]);

  /* =======================
     MONITOR CONNECTION STATE - FIXED
  ======================= */

  useEffect(() => {
    console.log("🔌 WebRTC Connection State:", connectionState);

    // 🔥 FIX: Only end if really failed and not already ending
    if (connectionState === "failed" && !endingRef.current && audioOn) {
      console.log("❌ Connection failed, ending call");
      handleEnd("connection_failed");
    }

    // 🔥 FIX: Handle disconnected state
    if (connectionState === "disconnected" && !endingRef.current && audioOn) {
      console.log("⚠️ Connection disconnected, waiting for reconnect...");
      // Don't end immediately, let WebRTC try to reconnect
    }

    // 🔥 FIX: When connected, log success
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
      setCallSeconds(0);
    }
  }, [audioOn]);

  /* =======================
     SAFE END HANDLER - FIXED
  ======================= */

  const handleEnd = (reason = "user_ended") => {
    if (endingRef.current) {
      console.log("🔚 Already ending call");
      return;
    }

    console.log("🔚 Ending call, reason:", reason);
    endingRef.current = true;
    startedRef.current = false;

    // 🔥 FIX: Call parent handler
    if (onEndCall) {
      onEndCall(reason);
    }

    // 🔥 FIX: Small delay before turning off audio
    setTimeout(() => {
      setAudioOn(false);
    }, 100);
  };

  if (!audioOn) return null;

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-black text-white p-6">

      {/* Status Card */}
      <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 w-full max-w-md border border-white/10 shadow-2xl">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <div className="text-7xl mb-4 animate-pulse">🎧</div>
            <div className="absolute -top-1 -right-1 w-4 h-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500"></span>
            </div>
          </div>

          <div className="text-2xl font-bold mb-2">Voice Connected</div>

          {/* Connection State */}
          <div className="flex items-center justify-center gap-2 text-sm">
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
            <div className="text-slate-400">⏱ {formatTime()}</div>
          </div>
        </div>

        {/* Audio Call Component */}
        <AudioCall
          webrtc={webrtc}
          onEnd={() => handleEnd("user_ended")}
        />

        {/* Footer */}
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