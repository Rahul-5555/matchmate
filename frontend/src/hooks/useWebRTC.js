import { useEffect, useRef, useState, useCallback } from "react";

// Optimized ICE servers
const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
  iceCandidatePoolSize: 10,
};

// Audio constraints
const AUDIO_CONSTRAINTS = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  sampleRate: 48000,
};

const useWebRTC = ({ socket, matchId, isCaller }) => {
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const pendingCandidatesRef = useRef([]);

  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [connectionState, setConnectionState] = useState("new");
  const [isMuted, setIsMuted] = useState(false);
  const [isMicReady, setIsMicReady] = useState(false);

  // Clean up everything
  const cleanup = useCallback(() => {
    console.log("🧹 Cleaning up WebRTC");

    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }

    setRemoteStream(null);
    setIsMicReady(false);
    pendingCandidatesRef.current = [];
    setConnectionState("closed");
  }, []);

  // Get microphone
  const getMicrophone = useCallback(async () => {
    try {
      console.log("🎤 Getting microphone...");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: AUDIO_CONSTRAINTS
      });

      localStreamRef.current = stream;
      setLocalStream(stream);
      setIsMicReady(true);
      console.log("✅ Microphone ready");

      return stream;
    } catch (err) {
      console.error("❌ Microphone error:", err);
      alert("Please allow microphone access");
      return null;
    }
  }, []);

  // Create peer connection
  const createPeerConnection = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate && socket?.connected && matchId) {
        socket.emit("ice-candidate", {
          matchId,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      console.log("📥 Remote track received");
      const [stream] = event.streams;
      remoteStreamRef.current = stream;
      setRemoteStream(stream);
    };

    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      console.log("❄️ ICE State:", state);
      setConnectionState(state);
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      console.log("🔌 Connection State:", state);

      if (state === "failed" || state === "closed") {
        cleanup();
      }
    };

    pcRef.current = pc;
    return pc;
  }, [socket, matchId, cleanup]);

  // Start call (caller only)
  const startCall = useCallback(async () => {
    if (!isCaller) {
      console.log("⏳ Not caller, waiting for offer");
      return;
    }

    if (!socket?.connected || !matchId) {
      console.log("❌ Cannot start call - no socket or matchId");
      return;
    }

    console.log("📞 Starting call as caller...");

    // Get microphone
    const stream = await getMicrophone();
    if (!stream) return;

    // Create peer connection
    const pc = createPeerConnection();

    // Add tracks
    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
    });

    // Create and send offer
    try {
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
      });

      await pc.setLocalDescription(offer);
      console.log("📤 Sending offer");
      socket.emit("offer", { matchId, offer });

    } catch (err) {
      console.error("❌ Error creating offer:", err);
    }
  }, [isCaller, socket, matchId, getMicrophone, createPeerConnection]);

  // Handle signaling
  useEffect(() => {
    if (!socket) return;

    const handleOffer = async ({ offer }) => {
      if (isCaller) return;

      console.log("📥 Offer received");

      // Get microphone
      const stream = await getMicrophone();
      if (!stream) return;

      // Create peer connection
      const pc = createPeerConnection();

      // Add tracks
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));

        // Add pending candidates
        for (const candidate of pendingCandidatesRef.current) {
          await pc.addIceCandidate(candidate);
        }
        pendingCandidatesRef.current = [];

        // Create answer
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        console.log("📤 Sending answer");
        socket.emit("answer", { matchId, answer });

      } catch (err) {
        console.error("❌ Error handling offer:", err);
      }
    };

    const handleAnswer = async ({ answer }) => {
      if (!pcRef.current) return;

      console.log("📥 Answer received");

      try {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));

        // Add pending candidates
        for (const candidate of pendingCandidatesRef.current) {
          await pcRef.current.addIceCandidate(candidate);
        }
        pendingCandidatesRef.current = [];

        console.log("✅ WebRTC connected!");

      } catch (err) {
        console.error("❌ Error handling answer:", err);
      }
    };

    const handleIceCandidate = async ({ candidate }) => {
      if (!pcRef.current) {
        pendingCandidatesRef.current.push(candidate);
        return;
      }

      if (pcRef.current.remoteDescription) {
        try {
          await pcRef.current.addIceCandidate(candidate);
        } catch (err) {
          console.log("⚠️ Error adding ICE candidate:", err);
        }
      } else {
        pendingCandidatesRef.current.push(candidate);
      }
    };

    const handleCallEnded = () => {
      console.log("🔚 Call ended by server");
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

  // Mute toggle
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const track = localStreamRef.current.getAudioTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setIsMuted(!track.enabled);
      }
    }
  }, []);

  const replaceMicrophone = useCallback(async (deviceId) => {
    if (!pcRef.current) return;

    console.log("🎤 Replacing microphone...");

    const newStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        ...AUDIO_CONSTRAINTS,
        deviceId: { exact: deviceId }
      }
    });

    const newTrack = newStream.getAudioTracks()[0];

    const sender = pc.getSenders().find(s => s.track?.kind === 'audio');
    if (sender) {
      await sender.replaceTrack(newTrack); // 👈 This keeps the connection alive!
    }

    if (sender) {
      await sender.replaceTrack(newTrack);
      console.log("✅ Track replaced successfully");
    }

    // Stop old tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
    }

    localStreamRef.current = newStream;
    setLocalStream(newStream);

  }, []);


  // Reset function for new calls
  /* =======================
   RESET CALL STATE - FIXED
======================= */

  const resetCall = useCallback(() => {
    // 🔥 FIX: Add lock to prevent multiple resets
    if (resetLockRef.current) {
      console.log("🔒 Reset already in progress, skipping");
      return;
    }

    resetLockRef.current = true;
    console.log("🔄 Resetting WebRTC for new call");

    cleanup();

    // Release lock after reset
    setTimeout(() => {
      resetLockRef.current = false;
    }, 500);

  }, [cleanup]);

  // Add this ref at the top with other refs
  const resetLockRef = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    localStream,
    remoteStream,
    startCall,
    toggleMute,
    isMuted,
    isMicReady,
    connectionState,
    resetCall,
    replaceMicrophone,
    peerConnection: pcRef.current,
  };
};

export default useWebRTC;