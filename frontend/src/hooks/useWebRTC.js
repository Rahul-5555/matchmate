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

const useWebRTC = (socket, matchId) => {
  const pcRef = useRef(null);
  const micTrackRef = useRef(null);
  const pendingIceRef = useRef([]);

  const startedRef = useRef(false);

  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isMicReady, setIsMicReady] = useState(false);

  /* 🔌 CREATE PEER CONNECTION */
  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.ontrack = (e) => {
      const remote = e.streams[0];
      setRemoteStream(remote);
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("ice-candidate", {
          matchId,
          candidate: e.candidate,
        });
      }
    };

    pcRef.current = pc;
    return pc;
  }, [socket, matchId]);

  /* ▶️ START CALL */
  const startCall = useCallback(async () => {
    if (!socket || !matchId) return;
    if (startedRef.current) return;

    startedRef.current = true;

    const pc = createPeerConnection();

    /* 🎤 MIC */
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    const track = stream.getAudioTracks()[0];
    micTrackRef.current = track;

    setLocalStream(stream);
    setIsMicReady(true);

    stream.getTracks().forEach((t) => pc.addTrack(t, stream));
  }, [socket, matchId, createPeerConnection]);

  /* 🔐 SOCKET SIGNALING (CLEAN & SAFE) */
  useEffect(() => {
    if (!socket) return;

    const onOffer = async ({ offer }) => {
      if (!pcRef.current) createPeerConnection();

      const pc = pcRef.current;
      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      // 🔥 apply queued ICE
      for (const ice of pendingIceRef.current) {
        await pc.addIceCandidate(ice);
      }
      pendingIceRef.current = [];

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer", { matchId, answer });
    };

    const onAnswer = async ({ answer }) => {
      if (!pcRef.current) return;

      const pc = pcRef.current;
      await pc.setRemoteDescription(new RTCSessionDescription(answer));

      for (const ice of pendingIceRef.current) {
        await pc.addIceCandidate(ice);
      }
      pendingIceRef.current = [];
    };

    const onIce = async ({ candidate }) => {
      if (!pcRef.current || !candidate) return;

      const pc = pcRef.current;
      if (pc.remoteDescription) {
        await pc.addIceCandidate(candidate);
      } else {
        pendingIceRef.current.push(candidate);
      }
    };

    const onCallEnd = () => {
      endCall(false);
    };

    socket.on("offer", onOffer);
    socket.on("answer", onAnswer);
    socket.on("ice-candidate", onIce);
    socket.on("call-ended", onCallEnd);

    return () => {
      socket.off("offer", onOffer);
      socket.off("answer", onAnswer);
      socket.off("ice-candidate", onIce);
      socket.off("call-ended", onCallEnd);
    };
  }, [socket, matchId, createPeerConnection]);

  /* 🔇 MUTE */
  const toggleMute = useCallback(() => {
    if (!micTrackRef.current) return;

    const enabled = micTrackRef.current.enabled;
    micTrackRef.current.enabled = !enabled;
    setIsMuted(enabled);

    socket.emit(enabled ? "mute" : "unmute");
  }, [socket]);

  /* ❌ END CALL */
  const endCall = useCallback(
    (emit = true) => {
      startedRef.current = false;
      pendingIceRef.current = [];

      if (pcRef.current) {
        pcRef.current.getSenders().forEach((s) => s.track && s.track.stop());
        pcRef.current.close();
        pcRef.current = null;
      }

      localStream?.getTracks().forEach((t) => t.stop());

      setLocalStream(null);
      setRemoteStream(null);
      setIsMuted(false);
      setIsMicReady(false);

      if (emit) socket.emit("call-ended", { matchId });
    },
    [socket, matchId, localStream]
  );

  return {
    localStream,
    remoteStream,
    startCall,
    endCall,
    toggleMute,
    isMuted,
    isMicReady,
  };
};

export default useWebRTC;
