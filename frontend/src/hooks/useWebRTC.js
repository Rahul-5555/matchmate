import { useRef, useState } from "react";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },

    // 🔥 TURN (TEST / FREE)
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
};


const CALL_DURATION_MS = 10 * 15 * 1000;
// 🔁 PROD: 10 * 60 * 1000

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

    // 🔌 PeerConnection
    pcRef.current = new RTCPeerConnection(ICE_SERVERS);

    // 🎤 Mic
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    console.log("🎤 MIC STREAM READY");

    const audioTrack = stream.getAudioTracks()[0];
    micTrackRef.current = audioTrack;
    setIsMicReady(true);

    stream.getTracks().forEach((track) => {
      pcRef.current.addTrack(track, stream);
    });

    setLocalStream(stream);

    // 🔊 Remote audio
    pcRef.current.ontrack = (event) => {
      console.log("🔊 Remote track received");
      setRemoteStream(event.streams[0]);
    };

    // ❄️ ICE
    pcRef.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          matchId,
          candidate: event.candidate,
        });
      }
    };

    // 🔐 Socket listeners (ONCE)
    if (!listenersAttachedRef.current) {
      listenersAttachedRef.current = true;

      socket.on("offer", async ({ offer }) => {
        if (!pcRef.current) return;

        if (pcRef.current.signalingState !== "stable") {
          console.warn("⚠️ Offer ignored (not stable)");
          return;
        }

        console.log("📡 Offer received");
        await pcRef.current.setRemoteDescription(offer);

        const answer = await pcRef.current.createAnswer();
        await pcRef.current.setLocalDescription(answer);
        socket.emit("answer", { matchId, answer });
      });

      socket.on("answer", async ({ answer }) => {
        if (!pcRef.current) return;
        console.log("📡 Answer received");
        await pcRef.current.setRemoteDescription(answer);
      });

      socket.on("ice-candidate", async ({ candidate }) => {
        if (!pcRef.current) return;
        try {
          await pcRef.current.addIceCandidate(candidate);
        } catch (e) {
          console.error("ICE error", e);
        }
      });

      // 🔥 partner forced end
      socket.on("call-ended", () => {
        console.log("📴 Call ended by partner");
        endCall(false);
      });
    }

    // 🚀 CREATE OFFER (ONLY ONE SIDE)
    if (socket.id < matchId && pcRef.current.signalingState === "stable") {
      const offer = await pcRef.current.createOffer();
      await pcRef.current.setLocalDescription(offer);
      socket.emit("offer", { matchId, offer });
      console.log("🚀 Offer sent (caller)");
    } else {
      console.log("⏳ Waiting for offer (callee)");
    }

    // ⏱ AUTO END CALL
    callTimerRef.current = setTimeout(() => {
      console.log("⏱️ Call time over – auto ending");
      socket.emit("call-ended", { matchId });
      endCall(false);
    }, CALL_DURATION_MS);
  };

  // 🔇 MUTE / UNMUTE
  const toggleMute = () => {
    if (!micTrackRef.current || !isMicReady) {
      console.warn("Mic not ready yet");
      return;
    }

    const enabled = micTrackRef.current.enabled;
    micTrackRef.current.enabled = !enabled;
    setIsMuted(enabled);

    socket.emit(enabled ? "mute" : "unmute");
  };

  // ❌ END CALL
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

    if (emit) {
      socket.emit("call-ended", { matchId });
    }
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
