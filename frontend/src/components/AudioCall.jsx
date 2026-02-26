import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const CALL_DURATION = 10 * 60;
const WARNING_TIME = 60;
const CRITICAL_TIME = 30;

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
  const [audioDevices, setAudioDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [isSwitchingDevice, setIsSwitchingDevice] = useState(false);
  const [showPlayButton, setShowPlayButton] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const endedRef = useRef(false);
  const timerRef = useRef(null);
  const localAudioRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const audioContextRef = useRef(null);

  /* ================= ATTACH STREAMS ================= */

  useEffect(() => {
    if (localStream && localAudioRef.current) {
      localAudioRef.current.srcObject = localStream;
      localAudioRef.current.muted = true;
      localAudioRef.current.play().catch(() => { });
    }
  }, [localStream]);

  useEffect(() => {
    if (!remoteStream || !remoteAudioRef.current) return;

    remoteAudioRef.current.srcObject = remoteStream;

    const tryPlay = async () => {
      try {
        await remoteAudioRef.current.play();
        setIsPlaying(true);
        setShowPlayButton(false);
      } catch {
        setShowPlayButton(true);
      }
    };

    tryPlay();

    const enableAudio = async () => {
      try {
        await remoteAudioRef.current.play();
        setIsPlaying(true);
        setShowPlayButton(false);
      } catch { }
    };

    document.addEventListener("click", enableAudio, { once: true });
    document.addEventListener("touchstart", enableAudio, { once: true });

    return () => {
      document.removeEventListener("click", enableAudio);
      document.removeEventListener("touchstart", enableAudio);
    };
  }, [remoteStream]);

  /* ================= TIMER ================= */

  useEffect(() => {
    if (connectionState !== "connected" || !remoteStream || endedRef.current)
      return;

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          handleEnd("timeout");
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [connectionState, remoteStream]);

  /* ================= AUDIO DEVICES ================= */

  useEffect(() => {
    const loadDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const inputs = devices.filter(d => d.kind === "audioinput");
        setAudioDevices(inputs);
        if (!selectedDevice && inputs[0]) {
          setSelectedDevice(inputs[0].deviceId);
        }
      } catch { }
    };

    loadDevices();
    navigator.mediaDevices.addEventListener("devicechange", loadDevices);

    return () =>
      navigator.mediaDevices.removeEventListener("devicechange", loadDevices);
  }, [selectedDevice]);

  /* ================= VISUALIZER ================= */

  useEffect(() => {
    if (!remoteStream || !canvasRef.current) return;

    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;

    const source = audioContext.createMediaStreamSource(remoteStream);
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = 80;
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        ctx.fillStyle = `hsl(${260 + (barHeight / canvas.height) * 60},80%,60%)`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };

    draw();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationRef.current);
      source.disconnect();
      audioContext.close();
    };
  }, [remoteStream]);

  /* ================= DEVICE SWITCH ================= */

  const changeAudioDevice = async (deviceId) => {
    if (!localStream) return;

    setIsSwitchingDevice(true);

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: { exact: deviceId },
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const newTrack = newStream.getAudioTracks()[0];
      const oldTrack = localStream.getAudioTracks()[0];

      const sender = webrtc.peerConnection
        ?.getSenders()
        .find((s) => s.track?.kind === "audio");

      if (sender) await sender.replaceTrack(newTrack);

      if (oldTrack) oldTrack.stop();
      localStream.removeTrack(oldTrack);
      localStream.addTrack(newTrack);

      setSelectedDevice(deviceId);
    } catch (err) {
      console.error("Device switch failed:", err);
    }

    setTimeout(() => setIsSwitchingDevice(false), 300);
  };

  /* ================= END ================= */

  const handleEnd = (reason = "ended") => {
    if (endedRef.current) return;
    endedRef.current = true;

    clearInterval(timerRef.current);

    // 🔥 Reset WebRTC completely
    webrtc.resetCall?.();

    // 🔥 Redirect
    onEnd?.(reason);

    // 🔥 Force refresh after small delay
    setTimeout(() => {
      window.location.replace("/");
    }, 300);
  };

  const formatTime = (t) => {
    const m = Math.floor(t / 60);
    const s = t % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const isCritical = timeLeft <= CRITICAL_TIME;
  const isEndingSoon = timeLeft <= WARNING_TIME && timeLeft > CRITICAL_TIME;

  const getTimerColor = () => {
    if (isCritical) return "text-red-400";
    if (isEndingSoon) return "text-yellow-400";
    return "text-slate-400";
  };

  /* ================= UI ================= */

  return (
    <div className="w-full relative overflow-hidden rounded-3xl p-8 text-white shadow-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 border border-slate-700">

      {/* Background Glow Effect */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-indigo-600 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-purple-600 rounded-full blur-3xl" />
      </div>

      <audio ref={localAudioRef} autoPlay playsInline />
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* Top Section */}
      <div className="relative z-10 flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${connectionState === "connected"
            ? "bg-green-500 animate-pulse shadow-lg shadow-green-500/50"
            : connectionState === "connecting"
              ? "bg-yellow-400 animate-pulse"
              : "bg-red-500"
            }`} />
          <span className="text-sm text-slate-300 capitalize tracking-wide">
            {connectionState === "connected" ? "Connected" : connectionState}
          </span>
        </div>

        <span className={`text-sm font-mono tracking-widest ${getTimerColor()}`}>
          {formatTime(timeLeft)}
        </span>
      </div>

      {/* Circular Voice Visualizer */}
      <div className="relative flex justify-center items-center mb-8">
        <div
          className="absolute w-40 h-40 rounded-full bg-indigo-500/10"
          style={{
            transform: `scale(${1 + (audioLevel || 0) / 150})`,
            transition: "transform 0.1s ease-out"
          }}
        />

        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-500/30">
          <span className="text-2xl font-semibold">
            {isMuted ? "🔇" : "🎙️"}
          </span>
        </div>
      </div>

      {/* Play Button */}
      {showPlayButton && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-xl text-center mb-6 backdrop-blur-sm"
        >
          <p className="text-yellow-400 text-sm mb-2">
            🔇 Click to enable audio
          </p>
          <button
            onClick={() => remoteAudioRef.current?.play()}
            className="px-5 py-2 bg-yellow-500 text-black rounded-xl text-sm font-semibold hover:scale-105 transition"
          >
            Enable Audio
          </button>
        </motion.div>
      )}

      {/* Device Selector */}
      {audioDevices.length > 1 && (
        <div className="mb-6">
          <select
            value={selectedDevice || ""}
            onChange={(e) => changeAudioDevice(e.target.value)}
            disabled={isSwitchingDevice}
            className="w-full px-4 py-2 bg-slate-800/70 backdrop-blur-md rounded-xl text-sm border border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            {audioDevices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                🎤 {device.label || `Microphone ${device.deviceId.slice(0, 4)}`}
              </option>
            ))}
          </select>
          {isSwitchingDevice && (
            <p className="text-xs text-yellow-400 text-center mt-2 animate-pulse">
              Switching device...
            </p>
          )}
        </div>
      )}

      {/* Mic Status */}
      <p className="text-center text-xs text-slate-400 mb-6 tracking-wide">
        {!isMicReady
          ? "Initializing microphone..."
          : isMuted
            ? "You are muted"
            : "Speak freely"}
      </p>

      {/* Control Buttons */}
      <div className="flex justify-center gap-6">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={toggleMute}
          disabled={isSwitchingDevice}
          className={`px-8 py-3 rounded-2xl text-sm font-semibold transition-all shadow-lg ${isMuted
            ? "bg-yellow-600 hover:bg-yellow-500 shadow-yellow-500/30"
            : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/30"
            } disabled:opacity-50`}
        >
          {isMuted ? "Unmute" : "Mute"}
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => handleEnd("user-ended")}
          disabled={isSwitchingDevice}
          className="px-8 py-3 rounded-2xl text-sm font-semibold bg-red-600 hover:bg-red-500 shadow-lg shadow-red-500/30 disabled:opacity-50"
        >
          End Call
        </motion.button>
      </div>

      {/* Audio Active Badge */}
      {isPlaying && (
        <div className="text-center mt-6">
          <span className="text-xs text-green-400 bg-green-500/20 px-3 py-1 rounded-full animate-pulse">
            🔊 Audio Active
          </span>
        </div>
      )}
    </div>
  );
};

export default AudioCall;