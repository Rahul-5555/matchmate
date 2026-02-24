import { useState, useEffect, useCallback, useRef } from 'react';

export const usePayment = (socket) => {
  const [hasPremium, setHasPremium] = useState(false);
  const [premiumUntil, setPremiumUntil] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [loading, setLoading] = useState(false);

  const timerRef = useRef(null);
  const verificationSentRef = useRef(false); // 👈 TRACK VERIFICATION
  const listenersRegisteredRef = useRef(false); // 👈 TRACK LISTENERS

  // 🔥 Calculate time left
  const getTimeLeft = (expiryTime) => {
    if (!expiryTime) return null;

    const now = Date.now();
    const diff = expiryTime - now;

    if (diff <= 0) return null;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { hours, minutes, seconds };
  };

  // 🔥 Load from localStorage
  useEffect(() => {
    const token = localStorage.getItem('premium_token');
    const expiry = localStorage.getItem('premium_until');

    console.log("🔍 Loading premium from storage:", { token, expiry });

    if (token && expiry) {
      const expiryTime = parseInt(expiry);
      const now = Date.now();

      if (expiryTime > now) {
        setHasPremium(true);
        setPremiumUntil(expiryTime);

        const timeLeftCalc = getTimeLeft(expiryTime);
        setTimeLeft(timeLeftCalc);

        console.log(`✅ Premium loaded: ${timeLeftCalc?.hours}h ${timeLeftCalc?.minutes}m left`);
      } else {
        console.log("⏰ Premium expired");
        localStorage.removeItem('premium_token');
        localStorage.removeItem('premium_until');
      }
    }
  }, []); // 👈 Runs once

  // 🔥 Timer update
  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (!hasPremium || !premiumUntil) return;

    const updateTimer = () => {
      const now = Date.now();

      if (premiumUntil <= now) {
        setHasPremium(false);
        setPremiumUntil(null);
        setTimeLeft(null);
        localStorage.removeItem('premium_token');
        localStorage.removeItem('premium_until');

        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      } else {
        const timeLeftCalc = getTimeLeft(premiumUntil);
        setTimeLeft(timeLeftCalc);
      }
    };

    updateTimer();
    timerRef.current = setInterval(updateTimer, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [hasPremium, premiumUntil]);

  // 🔥 FIXED: Register socket listeners ONLY ONCE
  useEffect(() => {
    if (!socket) return;
    if (listenersRegisteredRef.current) return; // 👈 PREVENT MULTIPLE REGISTRATIONS

    console.log("📡 Registering premium socket listeners (ONCE)");

    const handlePremiumVerified = ({ expiresAt, restoredToken }) => {
      console.log("✨ Premium verified with server");

      if (restoredToken) {
        localStorage.setItem('premium_token', restoredToken);
      }

      if (expiresAt !== premiumUntil) {
        setPremiumUntil(expiresAt);
        const timeLeftCalc = getTimeLeft(expiresAt);
        setTimeLeft(timeLeftCalc);
      }
    };

    const handlePremiumInvalid = () => {
      console.log("❌ Premium invalid on server");
      localStorage.removeItem('premium_token');
      localStorage.removeItem('premium_until');
      setHasPremium(false);
      setPremiumUntil(null);
      setTimeLeft(null);
    };

    socket.on('premium_verified', handlePremiumVerified);
    socket.on('premium_invalid', handlePremiumInvalid);

    listenersRegisteredRef.current = true;

    return () => {
      console.log("🧹 Cleaning up premium socket listeners");
      socket.off('premium_verified', handlePremiumVerified);
      socket.off('premium_invalid', handlePremiumInvalid);
      listenersRegisteredRef.current = false;
      verificationSentRef.current = false;
    };
  }, [socket]); // 👈 ONLY depends on socket

  // 🔥 FIXED: Send verification ONLY ONCE when premium is true
  useEffect(() => {
    if (!socket || !hasPremium) return;
    if (verificationSentRef.current) return; // 👈 PREVENT MULTIPLE VERIFICATIONS

    const token = localStorage.getItem('premium_token');
    const sessionId = localStorage.getItem('matchmate_permanent_session');

    if (token && sessionId) {
      console.log("🔍 Sending ONE premium verification to server");
      socket.emit('verify_premium', { token, sessionId });
      verificationSentRef.current = true;
    }
  }, [socket, hasPremium]); // 👈 Runs when hasPremium becomes true

  // Activate premium after payment
  const activatePremium = useCallback((token, expiresAt) => {
    console.log("🎉 Activating premium until:", new Date(expiresAt).toLocaleString());

    localStorage.setItem('premium_token', token);
    localStorage.setItem('premium_until', expiresAt.toString());

    setHasPremium(true);
    setPremiumUntil(expiresAt);

    const timeLeftCalc = getTimeLeft(expiresAt);
    setTimeLeft(timeLeftCalc);

    // Reset verification flag so it sends again for new premium
    verificationSentRef.current = false;
  }, []);

  // Clear premium
  const clearPremium = useCallback(() => {
    console.log("🔴 Clearing premium");

    localStorage.removeItem('premium_token');
    localStorage.removeItem('premium_until');

    setHasPremium(false);
    setPremiumUntil(null);
    setTimeLeft(null);
  }, []);

  return {
    hasPremium,
    premiumUntil,
    timeLeft,
    loading,
    activatePremium,
    clearPremium
  };
};