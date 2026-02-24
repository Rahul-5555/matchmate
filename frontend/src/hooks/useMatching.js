import { useState, useRef, useCallback } from 'react';

const useMatching = (socketRef) => {
  const [stage, setStage] = useState("home");
  const [mode, setMode] = useState("chat");
  const [matchId, setMatchId] = useState(null);
  const [isCaller, setIsCaller] = useState(false);
  const [audioOn, setAudioOn] = useState(false);
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [selectedInterest, setSelectedInterest] = useState("global");

  const isMatchingRef = useRef(false);

  const calculatedStatus = stage === "matching"
    ? "matching"
    : stage === "chat"
      ? "connected"
      : "idle";

  const startMatching = useCallback((selectedMode) => {
    if (!socketRef.current || isMatchingRef.current) return;
    console.log("🎯 startMatching called with mode:", selectedMode);
    setMode(selectedMode);
    setShowInterestModal(true);
  }, [socketRef]);

  const confirmMatching = useCallback(() => {
    if (!socketRef.current || isMatchingRef.current) return;

    console.log("🔍 confirmMatching called with mode:", mode, "interest:", selectedInterest);

    isMatchingRef.current = true;
    setMatchId(null);
    setIsCaller(false);
    setAudioOn(false);
    setStage("matching");
    setShowInterestModal(false);

    // 🔥 FIX 1: Send mode to server!
    socketRef.current.emit("find_match", {
      interest: selectedInterest,
      mode: mode // 👈 CRITICAL: Send mode to server
    });
  }, [socketRef, selectedInterest, mode]);

  // 🔥 FIX 2: Receive mode from server
  const handleMatched = useCallback(({ matchId, role, mode: receivedMode }) => {
    if (stage !== "matching") return;

    console.log("🎯 handleMatched called with:", { matchId, role, receivedMode });

    isMatchingRef.current = false;
    setMatchId(matchId);
    setIsCaller(role === "caller");

    // 🔥 CRITICAL: Use received mode if available, otherwise fallback to current mode
    const finalMode = receivedMode || mode;
    setMode(finalMode);

    if (finalMode === "audio") {
      setAudioOn(true);
      console.log("🎧 Setting audioOn = true for mode:", finalMode);
    } else {
      setAudioOn(false);
    }

    setStage("chat");
  }, [stage, mode]);

  const handleEnd = useCallback(() => {
    console.log("👋 handleEnd called");
    setAudioOn(false);
    setMatchId(null);
    setIsCaller(false);
    isMatchingRef.current = false;
    setStage("home");
  }, []);

  const closeModal = useCallback(() => {
    setShowInterestModal(false);
  }, []);

  return {
    // State
    stage,
    mode,
    matchId,
    isCaller,
    audioOn,
    showInterestModal,
    selectedInterest,
    calculatedStatus,

    // Setters
    setAudioOn,
    setSelectedInterest,

    // Actions
    startMatching,
    confirmMatching,
    handleMatched,
    handleEnd,
    closeModal,
  };
};

export default useMatching;