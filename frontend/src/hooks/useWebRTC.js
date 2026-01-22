import { useRef, useState } from "react";

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

const CALL_DURATION_MS = 10 * 60 * 1000;

const useWebRTC = (socket, matchId) => {
  const pcRef = useRef(null);
  const micTrackRef = useRef(null);
  const callTimerRef = useRef(null);

  const startedRef = useRef(false);
  const listenersAttachedRef = useRef(false);

  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isMicReady, setIsMicReady] = useState(false);

  const startCall = async () => {
    if (!socket || !matchId) return;
    if (startedRef.current) return;

    startedRef.current = true;

    /* 🔌 CREATE PEER CONNECTION */
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    /* 🎤 GET MIC */
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    console.log("🎤 MIC STREAM READY");

    const audioTrack = stream.getAudioTracks()[0];
    micTrackRef.current = audioTrack;
    setIsMicReady(true);
    setLocalStream(stream);

    /* ➕ ADD TRACKS SAFELY */
    stream.getTracks().forEach((track) => {
      if (!pcRef.current) return;
      pcRef.current.addTrack(track, stream);
    });

    /* 🔊 REMOTE AUDIO */
    pc.ontrack = (event) => {
      console.log("🔊 Remote track received");
      const remote = event.streams[0];
      setRemoteStream(remote);

      // 🔥 force play (browser autoplay fix)
      const audio = new Audio();
      audio.srcObject = remote;
      audio.autoplay = true;
      audio.playsInline = true;
      audio.play().catch(() => { });
    };

    /* ❄️ ICE */
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          matchId,
          candidate: event.candidate,
        });
      }
    };

    /* 🔐 SOCKET LISTENERS (ONCE) */
    if (!listenersAttachedRef.current) {
      listenersAttachedRef.current = true;

      socket.on("offer", async ({ offer }) => {
        if (!pcRef.current) return;

        console.log("📡 Offer received");
        await pcRef.current.setRemoteDescription(
          new RTCSessionDescription(offer)
        );

        const answer = await pcRef.current.createAnswer();
        await pcRef.current.setLocalDescription(answer);
        socket.emit("answer", { matchId, answer });
      });

      socket.on("answer", async ({ answer }) => {
        if (!pcRef.current) return;

        console.log("📡 Answer received");
        await pcRef.current.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
      });

      socket.on("ice-candidate", async ({ candidate }) => {
        if (!pcRef.current) return;
        try {
          await pcRef.current.addIceCandidate(candidate);
        } catch (e) {
          console.error("ICE error", e);
        }
      });

      socket.on("call-ended", () => {
        console.log("📴 Partner ended call");
        endCall(false);
      });
    }

    /* 🚀 DETERMINISTIC CALLER */
    const isCaller = socket.id === matchId.split("_")[1];

    if (isCaller) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("offer", { matchId, offer });
      console.log("🚀 Offer sent");
    } else {
      console.log("⏳ Waiting for offer");
    }

    /* ⏱ AUTO END */
    callTimerRef.current = setTimeout(() => {
      console.log("⏱️ Call time over");
      socket.emit("call-ended", { matchId });
      endCall(false);
    }, CALL_DURATION_MS);
  };

  /* 🔇 MUTE */
  const toggleMute = () => {
    if (!micTrackRef.current) return;

    const enabled = micTrackRef.current.enabled;
    micTrackRef.current.enabled = !enabled;
    setIsMuted(enabled);

    socket.emit(enabled ? "mute" : "unmute");
  };

  /* ❌ END CALL */
  const endCall = (emit = true) => {
    if (callTimerRef.current) {
      clearTimeout(callTimerRef.current);
      callTimerRef.current = null;
    }

    startedRef.current = false;
    listenersAttachedRef.current = false;

    pcRef.current?.close();
    pcRef.current = null;

    localStream?.getTracks().forEach((t) => t.stop());

    setLocalStream(null);
    setRemoteStream(null);
    setIsMuted(false);
    setIsMicReady(false);

    if (emit) socket.emit("call-ended", { matchId });
  };

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
