import { useState, useEffect, useCallback } from 'react';
import { GENDERS, DEFAULT_USER_PREFERENCE } from '../utils/constants'; // 👈 FIXED: DEFAULT_GENDER_PREFERENCE → DEFAULT_USER_PREFERENCE

export const useGenderFilter = (socket) => {
  const [preference, setPreference] = useState(DEFAULT_USER_PREFERENCE); // 👈 FIXED
  const [hasPaid, setHasPaid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load saved preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('gender_preference');
    if (saved) {
      try {
        setPreference(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load preference:', e);
      }
    }
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handlePaymentVerified = () => {
      setHasPaid(true);
      setError(null);
    };

    const handlePaymentRequired = ({ message }) => {
      setError(message);
      setIsLoading(false);
    };

    const handleMatchFound = () => {
      setIsLoading(false);
    };

    socket.on('payment_verified', handlePaymentVerified);
    socket.on('payment_required', handlePaymentRequired);
    socket.on('match_found', handleMatchFound);

    return () => {
      socket.off('payment_verified', handlePaymentVerified);
      socket.off('payment_required', handlePaymentRequired);
      socket.off('match_found', handleMatchFound);
    };
  }, [socket]);

  // Find match with gender filter
  const findMatch = useCallback(async (interest = 'global', mode = 'chat') => {
    if (!socket) {
      setError('Not connected to server');
      return;
    }

    setIsLoading(true);
    setError(null);

    console.log("🔍 Gender filter findMatch called with:", {
      myGender: preference.myGender,
      lookingFor: preference.lookingFor,
      interest,
      mode
    });

    socket.emit('find_match_with_gender', {
      myGender: preference.myGender,
      lookingFor: preference.lookingFor,
      interest,
      mode
    });

    // Save preference
    localStorage.setItem('gender_preference', JSON.stringify(preference));
  }, [socket, preference]);

  // Update preference
  const updatePreference = useCallback((newPref) => {
    setPreference(prev => ({
      ...prev,
      ...newPref
    }));
  }, []);

  // Reset to default
  const resetPreference = useCallback(() => {
    setPreference(DEFAULT_USER_PREFERENCE); // 👈 FIXED
    localStorage.removeItem('gender_preference');
  }, []);

  return {
    preference,
    hasPaid,
    isLoading,
    error,
    findMatch,
    updatePreference,
    resetPreference
  };
};