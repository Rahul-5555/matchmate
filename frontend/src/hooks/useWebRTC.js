import { useEffect, useRef, useState, useCallback } from "react";

/* ================= ICE ================= */

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
  iceCandidatePoolSize: 10,
};

/* ================= MODERN AUDIO CONSTRAINTS ================= */

const AUDIO_CONSTRAINTS = {
  audio: {
    echoCancellation: { ideal: true },
    noiseSuppression: { ideal: true },
    autoGainControl: { ideal: true },
    channelCount: 1,
    sampleRate: 48000,
    sampleSize: 16,
    latency: 0,
  },
};

const useWebRTC = ({ socket, matchId, isCaller }) => {
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const audioContextRef = useRef(null);
  const resetLockRef = useRef(false);

  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [connectionState, setConnectionState] = useState("new");
  const [isMuted, setIsMuted] = useState(false);
  const [isMicReady, setIsMicReady] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  /* ================= CLEAN PROCESSING (NO ROBOTIC SOUND) ================= */

  const processAudioStream = useCallback(async (inputStream) => {
    try {
      const audioContext = new AudioContext({ latencyHint: "interactive" });
      audioContextRef.current = audioContext;

      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      const source = audioContext.createMediaStreamSource(inputStream);

      // 🎯 Light Highpass (remove fan / rumble)
      const highpass = audioContext.createBiquadFilter();
      highpass.type = "highpass";
      highpass.frequency.value = 80;

      // 🎯 Soft compressor (natural leveling)
      const compressor = audioContext.createDynamicsCompressor();
      compressor.threshold.value = -24;
      compressor.knee.value = 30;
      compressor.ratio.value = 3;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.25;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;

      const destination = audioContext.createMediaStreamDestination();

      source
        .connect(highpass)
        .connect(compressor)
        .connect(analyser)
        .connect(destination);

      /* ===== Voice level detection ===== */

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const detectLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
        setAudioLevel(sum / bufferLength);
        requestAnimationFrame(detectLevel);
      };
      detectLevel();

      return destination.stream;
    } catch (err) {
      console.error("Audio processing error:", err);
      return inputStream;
    }
  }, []);

  /* ================= CLEANUP ================= */

  const cleanup = useCallback(() => {
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }

    setRemoteStream(null);
    setIsMicReady(false);
    setConnectionState("closed");
  }, []);

  /* ================= MICROPHONE ================= */

  const getMicrophone = useCallback(async () => {
    try {
      const rawStream = await navigator.mediaDevices.getUserMedia(
        AUDIO_CONSTRAINTS
      );

      const processedStream = await processAudioStream(rawStream);

      // ❌ DO NOT STOP rawStream (important)
      localStreamRef.current = processedStream;
      setLocalStream(processedStream);
      setIsMicReady(true);

      return processedStream;
    } catch (err) {
      console.error("Microphone error:", err);
      return null;
    }
  }, [processAudioStream]);

  /* ================= PEER CONNECTION ================= */

  const createPeerConnection = useCallback(() => {
    if (pcRef.current) pcRef.current.close();

    const pc = new RTCPeerConnection(ICE_SERVERS);

    // 🔥 IMPORTANT: Send ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket?.connected && matchId) {
        socket.emit("ice-candidate", {
          matchId,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      const [stream] = event.streams;
      remoteStreamRef.current = stream;
      setRemoteStream(stream);
    };

    pc.oniceconnectionstatechange = () => {
      setConnectionState(pc.iceConnectionState);
    };

    pc.onconnectionstatechange = () => {
      setConnectionState(pc.connectionState);
      if (pc.connectionState === "failed" || pc.connectionState === "closed") {
        cleanup();
      }
    };

    pcRef.current = pc;
    return pc;
  }, [socket, matchId, cleanup]);

  /* ================= START CALL ================= */

  const startCall = useCallback(async () => {
    if (!isCaller || !socket?.connected || !matchId) return;

    const pc = createPeerConnection();
    const stream = await getMicrophone();
    if (!stream) return;

    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    // 🎯 High Quality Opus Bitrate
    const sender = pc.getSenders().find((s) => s.track?.kind === "audio");
    if (sender) {
      const params = sender.getParameters();
      if (!params.encodings) params.encodings = [{}];
      params.encodings[0].maxBitrate = 128000; // 128kbps
      await sender.setParameters(params).catch(e => console.log("Bitrate setting failed:", e));
    }

    const offer = await pc.createOffer({
      offerToReceiveAudio: true,
      voiceActivityDetection: true,
    });

    await pc.setLocalDescription(offer);
    socket.emit("offer", { matchId, offer });
  }, [isCaller, socket, matchId, getMicrophone, createPeerConnection]);

  /* ================= SIGNALING ================= */

  useEffect(() => {
    if (!socket) return;

    const handleOffer = async ({ offer }) => {
      if (isCaller) return;

      const pc = createPeerConnection();
      const stream = await getMicrophone();
      if (!stream) return;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      for (const c of pendingCandidatesRef.current) {
        await pc.addIceCandidate(c);
      }
      pendingCandidatesRef.current = [];
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("answer", { matchId, answer });
    };

    const handleAnswer = async ({ answer }) => {
      if (!pcRef.current) return;
      await pcRef.current.setRemoteDescription(
        new RTCSessionDescription(answer)
      );
    };

    const handleIceCandidate = async ({ candidate }) => {
      if (!pcRef.current) {
        pendingCandidatesRef.current.push(candidate);
        return;
      }

      if (pcRef.current.remoteDescription) {
        await pcRef.current.addIceCandidate(candidate).catch(e => console.log("ICE add error:", e));
      } else {
        pendingCandidatesRef.current.push(candidate);
      }
    };

    const handleCallEnded = () => {
      cleanup();
    };

    socket.on("offer", handleOffer);
    socket.on("answer", handleAnswer);
    socket.on("ice-candidate", handleIceCandidate);
    socket.on("call-ended", handleCallEnded);
    socket.on("partner_disconnected", handleCallEnded);

    return () => {
      socket.off("offer", handleOffer);
      socket.off("answer", handleAnswer);
      socket.off("ice-candidate", handleIceCandidate);
      socket.off("call-ended", handleCallEnded);
      socket.off("partner_disconnected", handleCallEnded);
    };
  }, [socket, isCaller, matchId, getMicrophone, createPeerConnection, cleanup]);

  /* ================= MUTE ================= */

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const track = localStreamRef.current.getAudioTracks()[0];
      track.enabled = !track.enabled;
      setIsMuted(!track.enabled);
    }
  }, []);

  return {
    localStream,
    remoteStream,
    startCall,
    toggleMute,
    isMuted,
    isMicReady,
    connectionState,
    audioLevel,
  };
};

export default useWebRTC;