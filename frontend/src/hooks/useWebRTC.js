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
  const startedRef = useRef(false);
  const endedRef = useRef(false);

  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isMicReady, setIsMicReady] = useState(false);

  /* 🔌 CREATE PEER */
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

    pcRef.current = pc;
    return pc;
  }, [socket, matchId]);

  /* 🎤 MIC */
  const prepareMic = useCallback(async () => {
    if (micTrackRef.current) return;

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });

    micTrackRef.current = stream.getAudioTracks()[0];
    setLocalStream(stream);
    setIsMicReady(true);

    const pc = createPeer();
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));
  }, [createPeer]);

  /* ▶️ START CALL (CALLER ONLY) */
  const startCall = useCallback(async () => {
    if (!isCaller || startedRef.current || !socket || !matchId) return;

    startedRef.current = true;
    await prepareMic();

    const pc = pcRef.current;
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket.emit("offer", { matchId, offer });
  }, [isCaller, socket, matchId, prepareMic]);

  /* 🔁 SIGNALING */
  useEffect(() => {
    if (!socket) return;

    const onOffer = async ({ offer }) => {
      if (isCaller) return;

      const pc = createPeer();
      await prepareMic();
      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      pendingIceRef.current.forEach((c) => pc.addIceCandidate(c));
      pendingIceRef.current = [];

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("answer", { matchId, answer });
    };

    const onAnswer = async ({ answer }) => {
      await pcRef.current?.setRemoteDescription(
        new RTCSessionDescription(answer)
      );

      pendingIceRef.current.forEach((c) => pcRef.current.addIceCandidate(c));
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

    const onRemoteEnd = () => endCall(false);

    socket.on("offer", onOffer);
    socket.on("answer", onAnswer);
    socket.on("ice-candidate", onIce);
    socket.on("audio:ended", onRemoteEnd);

    return () => {
      socket.off("offer", onOffer);
      socket.off("answer", onAnswer);
      socket.off("ice-candidate", onIce);
      socket.off("audio:ended", onRemoteEnd);
    };
  }, [socket, matchId, isCaller, prepareMic, createPeer]);

  /* 🔇 MUTE */
  const toggleMute = () => {
    if (!micTrackRef.current) return;
    micTrackRef.current.enabled = !micTrackRef.current.enabled;
    setIsMuted(!micTrackRef.current.enabled);
  };

  /* ❌ END CALL */
  const endCall = useCallback(
    (emit = true) => {
      if (endedRef.current) return;
      endedRef.current = true;

      pcRef.current?.close();
      pcRef.current = null;

      localStream?.getTracks().forEach((t) => t.stop());

      micTrackRef.current = null;
      pendingIceRef.current = [];
      startedRef.current = false;

      setLocalStream(null);
      setRemoteStream(null);
      setIsMuted(false);
      setIsMicReady(false);

      if (emit && socket && matchId) {
        socket.emit("audio:end", { matchId });
      }
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
