import { useEffect, useRef, useState, useCallback } from "react";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
};

const useWebRTC = ({ socket, matchId, isCaller }) => {

  const pcRef = useRef(null);
  const micTrackRef = useRef(null);
  const pendingIceRef = useRef([]);
  const audioContextRef = useRef(null);

  const startedRef = useRef(false);
  const endedRef = useRef(false);

  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isMicReady, setIsMicReady] = useState(false);
  const [connectionState, setConnectionState] = useState("idle");

  /* =======================
     CREATE PEER
  ======================= */

  const createPeer = useCallback(() => {
    if (pcRef.current) return pcRef.current;

    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.ontrack = (e) => {
      setRemoteStream(e.streams[0]);
    };

    pc.onicecandidate = (e) => {
      if (e.candidate && socket && matchId) {
        socket.emit("ice-candidate", {
          matchId,
          candidate: e.candidate,
        });
      }
    };

    pc.onconnectionstatechange = () => {
      setConnectionState(pc.connectionState);

      if (
        pc.connectionState === "failed" ||
        pc.connectionState === "disconnected" ||
        pc.connectionState === "closed"
      ) {
        endCall();
      }
    };

    pcRef.current = pc;
    return pc;
  }, [socket, matchId]);

  /* =======================
     PREPARE MIC (PRO AUDIO)
  ======================= */

  const prepareMic = useCallback(async () => {
    if (micTrackRef.current) return;

    try {
      const rawStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1,
          latency: 0,
        },
      });

      // 🔥 Web Audio Processing (Remove low frequency noise like fan/hum)
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(rawStream);

      const highpass = audioContext.createBiquadFilter();
      highpass.type = "highpass";
      highpass.frequency.value = 100; // remove low hum

      const compressor = audioContext.createDynamicsCompressor();
      compressor.threshold.value = -50;
      compressor.knee.value = 40;
      compressor.ratio.value = 12;
      compressor.attack.value = 0;
      compressor.release.value = 0.25;

      const destination = audioContext.createMediaStreamDestination();

      source.connect(highpass);
      highpass.connect(compressor);
      compressor.connect(destination);

      const processedStream = destination.stream;

      micTrackRef.current = processedStream.getAudioTracks()[0];
      setLocalStream(processedStream);
      setIsMicReady(true);

      const pc = createPeer();
      pc.addTrack(micTrackRef.current, processedStream);

      // 🔥 Optimize bitrate (clear voice, no robotic compression)
      const sender = pc.getSenders().find(s => s.track?.kind === "audio");

      if (sender) {
        const params = sender.getParameters();
        params.encodings = [{ maxBitrate: 64000 }];
        sender.setParameters(params);
      }

    } catch (err) {
      console.error("Mic permission denied:", err);
      endCall();
    }
  }, [createPeer]);

  /* =======================
     START CALL
  ======================= */

  const startCall = useCallback(async () => {
    if (!isCaller || startedRef.current || !socket || !matchId)
      return;

    startedRef.current = true;
    endedRef.current = false;
    setConnectionState("connecting");

    await prepareMic();

    const pc = pcRef.current;
    if (!pc) return;

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket.emit("offer", { matchId, offer });
  }, [isCaller, socket, matchId, prepareMic]);

  /* =======================
     SIGNALING
  ======================= */

  useEffect(() => {
    if (!socket) return;

    const onOffer = async ({ offer }) => {
      if (isCaller) return;

      const pc = createPeer();
      await prepareMic();

      await pc.setRemoteDescription(
        new RTCSessionDescription(offer)
      );

      pendingIceRef.current.forEach((c) =>
        pc.addIceCandidate(c)
      );
      pendingIceRef.current = [];

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("answer", { matchId, answer });
    };

    const onAnswer = async ({ answer }) => {
      if (!pcRef.current) return;

      await pcRef.current.setRemoteDescription(
        new RTCSessionDescription(answer)
      );

      pendingIceRef.current.forEach((c) =>
        pcRef.current.addIceCandidate(c)
      );
      pendingIceRef.current = [];
    };

    const onIce = ({ candidate }) => {
      if (!pcRef.current) return;

      if (pcRef.current.remoteDescription) {
        pcRef.current.addIceCandidate(candidate);
      } else {
        pendingIceRef.current.push(candidate);
      }
    };

    socket.on("offer", onOffer);
    socket.on("answer", onAnswer);
    socket.on("ice-candidate", onIce);

    return () => {
      socket.off("offer", onOffer);
      socket.off("answer", onAnswer);
      socket.off("ice-candidate", onIce);
    };
  }, [socket, matchId, isCaller, prepareMic, createPeer]);

  /* =======================
     MUTE
  ======================= */

  const toggleMute = () => {
    if (!micTrackRef.current) return;

    micTrackRef.current.enabled = !micTrackRef.current.enabled;
    setIsMuted(!micTrackRef.current.enabled);
  };

  /* =======================
     END CALL
  ======================= */

  const endCall = useCallback(() => {
    if (endedRef.current) return;
    endedRef.current = true;

    try {
      pcRef.current?.getSenders().forEach((sender) => {
        sender.track?.stop();
      });
    } catch { }

    pcRef.current?.close();
    pcRef.current = null;

    localStream?.getTracks().forEach((t) => t.stop());

    audioContextRef.current?.close();
    audioContextRef.current = null;

    micTrackRef.current = null;
    pendingIceRef.current = [];
    startedRef.current = false;

    setLocalStream(null);
    setRemoteStream(null);
    setIsMuted(false);
    setIsMicReady(false);
    setConnectionState("idle");
  }, [localStream]);

  return {
    localStream,
    remoteStream,
    startCall,
    endCall,
    toggleMute,
    isMuted,
    isMicReady,
    connectionState,
  };
};

export default useWebRTC;
