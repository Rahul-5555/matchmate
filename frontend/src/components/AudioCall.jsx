import { useEffect, useRef, useState } from "react";

const CALL_DURATION = 10 * 60; // 10 minutes
const WARNING_TIME = 60; // 1 minute warning
const CRITICAL_TIME = 30; // 30 seconds critical

const AudioCall = ({ webrtc, onEnd }) => {
  const {
    localStream,
    remoteStream,
    isMuted,
    toggleMute,
    connectionState,
    audioLevel,
    isMicReady
  } = webrtc;

  const [timeLeft, setTimeLeft] = useState(CALL_DURATION);
  const [showControls, setShowControls] = useState(true);
  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [isSwitchingDevice, setIsSwitchingDevice] = useState(false);

  const endedRef = useRef(false);
  const timerRef = useRef(null);
  const hideControlsTimerRef = useRef(null);
  const peerConnectionRef = useRef(null); // We'll need to get this from webrtc

  const localAudioRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const audioContextRef = useRef(null);

  /* =======================
     GET PEER CONNECTION FROM WEBRTC
  ======================= */

  useEffect(() => {
    // Try to get peer connection from webrtc object
    if (webrtc && webrtc.peerConnection) {
      peerConnectionRef.current = webrtc.peerConnection;
    }
  }, [webrtc]);

  /* =======================
     ATTACH AUDIO STREAMS
  ======================= */

  useEffect(() => {
    if (localStream && localAudioRef.current && !isSwitchingDevice) {
      localAudioRef.current.srcObject = localStream;
      localAudioRef.current.muted = true;
      localAudioRef.current.play().catch(() => { });
    }
  }, [localStream, isSwitchingDevice]);

  useEffect(() => {
    if (remoteStream && remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.play().catch((e) => {
        console.log("🔇 Auto-play prevented");
      });
    }
  }, [remoteStream]);

  /* =======================
     GET AUDIO DEVICES
  ======================= */

  useEffect(() => {
    const getDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(d => d.kind === 'audioinput');
        setAudioDevices(audioInputs);

        if (audioInputs.length > 0 && !selectedDevice) {
          setSelectedDevice(audioInputs[0].deviceId);
        }
      } catch (err) {
        console.log("Could not enumerate devices:", err);
      }
    };

    getDevices();
    navigator.mediaDevices.addEventListener('devicechange', getDevices);

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', getDevices);
    };
  }, [selectedDevice]);

  /* =======================
     CHANGE AUDIO DEVICE - ULTIMATE FIX
  ======================= */

  const changeAudioDevice = async (deviceId) => {
    if (!localStream || isSwitchingDevice || !peerConnectionRef.current) return;

    setIsSwitchingDevice(true);
    console.log("🔄 Switching audio device to:", deviceId);

    try {
      // Get new stream with selected device
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: { exact: deviceId },
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      const oldTrack = localStream.getAudioTracks()[0];
      const newTrack = newStream.getAudioTracks()[0];

      if (!oldTrack || !newTrack) {
        throw new Error("Could not get audio tracks");
      }

      // 🔥 CRITICAL FIX: Use replaceTrack on the sender
      const pc = peerConnectionRef.current;
      const sender = pc.getSenders().find(s => s.track?.kind === 'audio');

      if (sender) {
        console.log("🔄 Using replaceTrack on sender");
        await sender.replaceTrack(newTrack);

        // Update local stream
        localStream.removeTrack(oldTrack);
        localStream.addTrack(newTrack);
        oldTrack.stop();

        console.log("✅ replaceTrack successful");
      } else {
        console.log("⚠️ No sender found, falling back to stream replacement");
        // Fallback method
        localStream.removeTrack(oldTrack);
        localStream.addTrack(newTrack);
        oldTrack.stop();
      }

      setSelectedDevice(deviceId);
      console.log("✅ Switched to new audio device");

      // Small delay to let everything stabilize
      setTimeout(() => {
        setIsSwitchingDevice(false);
      }, 300);

    } catch (err) {
      console.error("❌ Could not switch device:", err);
      setIsSwitchingDevice(false);
    }
  };

  /* =======================
     TIMER LOGIC
  ======================= */

  useEffect(() => {
    if (connectionState !== "connected" || !remoteStream || endedRef.current) {
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          handleEnd("timeout");
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
  }, [connectionState, remoteStream]);

  /* =======================
     AUTO-HIDE CONTROLS
  ======================= */

  useEffect(() => {
    const resetHideTimer = () => {
      setShowControls(true);

      if (hideControlsTimerRef.current) {
        clearTimeout(hideControlsTimerRef.current);
      }

      hideControlsTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    };

    window.addEventListener('mousemove', resetHideTimer);
    window.addEventListener('touchstart', resetHideTimer);
    resetHideTimer();

    return () => {
      window.removeEventListener('mousemove', resetHideTimer);
      window.removeEventListener('touchstart', resetHideTimer);
      if (hideControlsTimerRef.current) {
        clearTimeout(hideControlsTimerRef.current);
      }
    };
  }, []);

  /* =======================
     AUDIO VISUALIZER
  ======================= */

  useEffect(() => {
    if (!remoteStream || !canvasRef.current) return;

    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    audioContextRef.current = audioContext;

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;

    const source = audioContext.createMediaStreamSource(remoteStream);
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = 80;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const draw = () => {
      if (!canvasRef.current) return;

      animationRef.current = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        const hue = 260 + (barHeight / canvas.height) * 60;
        ctx.fillStyle = `hsl(${hue}, 80%, 60%)`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };

    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      source.disconnect();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [remoteStream]);

  /* =======================
     SAFE END HANDLER
  ======================= */

  const handleEnd = (reason = "ended") => {
    if (endedRef.current) return;
    endedRef.current = true;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    onEnd?.(reason);
  };

  const formatTime = (t) => {
    const m = Math.floor(t / 60);
    const s = t % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const isEndingSoon = timeLeft <= WARNING_TIME;
  const isCritical = timeLeft <= CRITICAL_TIME;

  const getTimerColor = () => {
    if (isCritical) return "text-red-500";
    if (isEndingSoon) return "text-yellow-400";
    return "text-white/80";
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return (
    <div className="w-full">
      <audio ref={localAudioRef} autoPlay playsInline />
      <audio ref={remoteAudioRef} autoPlay playsInline />

      <canvas
        ref={canvasRef}
        className="w-full h-20 rounded-lg bg-black/20 mb-4"
      />

      <div className="space-y-4">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-sm">
              {connectionState === "connected" ? "Connected" : connectionState}
              {isSwitchingDevice && " (Switching...)"}
            </span>
          </div>

          <div className={`text-sm font-mono ${getTimerColor()}`}>
            {formatTime(timeLeft)}
            {isCritical && <span className="ml-2 text-xs">⚠️</span>}
          </div>
        </div>

        {/* VOICE VISUALIZER */}
        <div className="flex justify-center items-end gap-1 h-12">
          {[...Array(20)].map((_, i) => {
            const level = Math.min(1, (audioLevel || 0) / 50);
            const height = Math.max(4, level * 40);

            return (
              <div
                key={i}
                className="w-2 bg-gradient-to-t from-indigo-500 to-purple-500 rounded-full transition-all duration-100"
                style={{
                  height: `${height}px`,
                  opacity: isMuted ? 0.2 : 0.5 + level * 0.5
                }}
              />
            );
          })}
        </div>

        {/* DEVICE SELECTOR */}
        {showControls && audioDevices.length > 1 && (
          <div className="mt-2">
            <select
              value={selectedDevice || ''}
              onChange={(e) => changeAudioDevice(e.target.value)}
              disabled={isSwitchingDevice}
              className={`w-full px-3 py-2 bg-white/10 rounded-lg text-sm border ${isSwitchingDevice ? 'border-yellow-500/50 opacity-50' : 'border-white/20'
                }`}
            >
              {audioDevices.map(device => (
                <option key={device.deviceId} value={device.deviceId} className="bg-slate-800">
                  🎤 {device.label || `Mic ${device.deviceId.slice(0, 4)}`}
                </option>
              ))}
            </select>
            {isSwitchingDevice && (
              <p className="text-xs text-yellow-400 text-center mt-1">
                Switching device...
              </p>
            )}
          </div>
        )}

        {/* STATUS MESSAGE */}
        <p className="text-center text-xs text-white/40">
          {!isMicReady ? "⏳ Initializing microphone..." :
            isSwitchingDevice ? "🔄 Switching microphone..." :
              isMuted ? "🔇 You're muted" :
                "🎤 Speak clearly"}
        </p>

        {/* CONTROLS */}
        <div className={`flex justify-center gap-2 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-40'}`}>
          <button
            onClick={toggleMute}
            disabled={isSwitchingDevice}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${isMuted ? "bg-yellow-500 text-black" : "bg-white/10 hover:bg-white/20"
              } ${isSwitchingDevice ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isMuted ? "Unmute" : "Mute"}
          </button>

          <button
            onClick={() => handleEnd("user-ended")}
            disabled={isSwitchingDevice}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500 hover:bg-red-600 transition disabled:opacity-50"
          >
            End Call
          </button>
        </div>

        {!showControls && (
          <div className="text-center text-[10px] text-white/30">
            Tap to show controls
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioCall;