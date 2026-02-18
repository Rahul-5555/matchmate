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
    setMode(selectedMode);
    setShowInterestModal(true);
  }, [socketRef]);

  const confirmMatching = useCallback(() => {
    if (!socketRef.current || isMatchingRef.current) return;

    isMatchingRef.current = true;
    setMatchId(null);
    setIsCaller(false);
    setAudioOn(false);
    setStage("matching");
    setShowInterestModal(false);

    socketRef.current.emit("find_match", {
      interest: selectedInterest,
    });
  }, [socketRef, selectedInterest]);

  const handleMatched = useCallback(({ matchId, role }) => {
    if (stage !== "matching") return;

    isMatchingRef.current = false;
    setMatchId(matchId);
    setIsCaller(role === "caller");

    if (mode === "audio") setAudioOn(true);

    setStage("chat");
  }, [stage, mode]);

  const handleEnd = useCallback(() => {
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