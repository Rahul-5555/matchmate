import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import useSocket from "../hooks/useSocket";
import useMatching from "../hooks/useMatching";
import useSocketEvents from "../hooks/useSocketEvents";
import { useGenderFilter } from "../hooks/useGenderFilter";
import { usePayment } from "../hooks/usePayment";
import { useToastContext } from "../App"; // 👈 NEW

// Components
import HeaderSection from "../components/LandingPage/HeaderSection";
import HeroSection from "../components/LandingPage/HeroSection";
import FeatureCards from "../components/LandingPage/FeatureCards";
import InterestModal from "../components/InterestModal";
import LanguageSelector from "../components/LanguageSelector";
import EnhancedGenderSelector from "../components/EnhancedGenderSelector";
import Matching from "./Matching";
import Chat from "./Chat";
import Header from "../components/Header";

// New engaging components
import LiveStats from "../components/LandingPage/LiveStats";
import Testimonials from "../components/LandingPage/Testimonials";
import BackgroundAnimation from "../components/LandingPage/BackgroundAnimation";

// Constants
import { DEFAULT_USER_PREFERENCE } from "../utils/constants";

const Home = () => {
  // 👇 NEW: Toast context
  const { showToast } = useToastContext();

  // Custom hooks
  const { socket, socketRef, isConnected } = useSocket();
  const {
    stage,
    mode,
    matchId,
    isCaller,
    audioOn,
    showInterestModal,
    selectedInterest,
    calculatedStatus,
    setAudioOn,
    setSelectedInterest,
    startMatching,
    confirmMatching,
    handleMatched,
    handleEnd,
    closeModal,
  } = useMatching(socketRef);

  // Gender filter hook
  const {
    preference,
    error: genderError,
    findMatch: findMatchWithGender,
    updatePreference
  } = useGenderFilter(socket);

  // Payment hook
  const {
    hasPremium,
    premiumUntil,
    timeLeft,
    activatePremium,
    clearPremium
  } = usePayment(socket);

  // UI State
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [showGenderSelector, setShowGenderSelector] = useState(false);
  const [selectedMode, setSelectedMode] = useState("chat");
  const [selectedLanguage, setSelectedLanguage] = useState('hi-en');

  // Socket event listeners
  useSocketEvents(socket, handleMatched);

  // Mouse move for parallax
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Hide scroll indicator
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) setShowScrollIndicator(false);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 👇 Language selector tab open hota hai jab user click kare
  const handleStartMatching = (mode) => {
    console.log("🎯 Start matching clicked with mode:", mode);
    setSelectedMode(mode);
    setShowLanguageSelector(true);
  };

  // Handle language selection
  const handleLanguageSelect = (lang) => {
    console.log("🗣️ Language selected:", lang);
    setSelectedLanguage(lang);
    setShowLanguageSelector(false);
    setShowGenderSelector(true);

    // 👇 NEW: Toast notification
    showToast(`Language set to ${lang === 'hi' ? 'हिन्दी' : lang === 'en' ? 'English' : 'Hinglish'}`, 'success', 2000);
  };

  // Handle gender selection
  const handleGenderSelect = async (selectedPref, isPaid = false) => {
    setShowGenderSelector(false);

    updatePreference({
      ...selectedPref,
      language: selectedLanguage
    });

    if (isPaid) {
      console.log("💳 Payment successful, premium activated");
      showToast("✨ Premium activated for 24 hours!", "success");
    }

    startMatching(selectedMode);
  };

  // Handle payment success
  const handlePaymentSuccess = (data) => {
    activatePremium(data.token, data.expiresAt);
    showToast("✅ Payment successful! Premium activated.", "success");
  };

  // Handle confirm matching with gender filter
  const handleConfirmMatching = () => {
    try {
      if (preference.lookingFor !== 'both' && socket) {
        findMatchWithGender(selectedInterest, mode);
      }
      confirmMatching();
      showToast("🔍 Finding your match...", "info", 2000);
    } catch (error) {
      console.error("❌ Matching error:", error);
      showToast("Something went wrong. Please try again.", "error");
    }
  };

  // Handle matched
  const handleMatchedWithToast = (data) => {
    handleMatched(data);
    showToast("✅ Match found! Connecting...", "success", 2000);
  };

  // Conditional renders
  if (stage === "matching" && socket) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Matching
          socket={socket}
          onMatched={handleMatchedWithToast}
          hasPremium={hasPremium}
          genderFilter={preference.lookingFor !== 'both' ? preference : null}
        />
      </motion.div>
    );
  }

  if (stage === "chat" && socket && matchId) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
      >
        <Chat
          socket={socket}
          mode={mode}
          matchId={matchId}
          audioOn={audioOn}
          setAudioOn={setAudioOn}
          isCaller={isCaller}
          onEnd={handleEnd}
          interest={selectedInterest}
          genderFilter={preference.lookingFor !== 'both' ? preference : null}
        />
      </motion.div>
    );
  }

  // Main Landing Page
  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-x-hidden"
      >
        {/* Background Animation */}
        <BackgroundAnimation mousePosition={mousePosition} />

        {/* Modals */}
        <AnimatePresence>
          {/* Language Selector Modal */}
          {showLanguageSelector && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[65] 
                         flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-md"
              >
                <LanguageSelector
                  onSelect={handleLanguageSelect}
                  initialLanguage={selectedLanguage}
                />
              </motion.div>
            </motion.div>
          )}

          {/* Gender Selector Modal */}
          {showGenderSelector && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] 
                         flex items-center justify-center p-4"
              onClick={() => setShowGenderSelector(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md"
              >
                <EnhancedGenderSelector
                  onSelect={handleGenderSelect}
                  initialPreference={preference}
                  hasPremium={hasPremium}
                  language={selectedLanguage}
                />
              </motion.div>
            </motion.div>
          )}

          {/* Interest Modal */}
          {showInterestModal && (
            <InterestModal
              isOpen={showInterestModal}
              selectedInterest={selectedInterest}
              setSelectedInterest={setSelectedInterest}
              onClose={closeModal}
              onConfirm={handleConfirmMatching}
            />
          )}
        </AnimatePresence>

        {/* Header */}
        <HeaderSection />

        {/* Connection Status */}
        {!isConnected && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="bg-yellow-500 text-white px-6 py-2 rounded-full shadow-lg 
                          flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span className="text-sm font-medium">Connecting to server...</span>
            </div>
          </motion.div>
        )}

        {/* Premium Status Badge with Timer */}
        {hasPremium && timeLeft && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute top-20 right-4 z-50"
          >
            <div className="bg-green-500 text-white px-2 py-1 rounded-full shadow-lg 
                          flex items-center gap-1 border border-green-300">
              <span className="text-xs">✨</span>
              <span className="text-xs font-medium">Premium</span>
              <span className="text-[10px] bg-white/30 px-1 py-0.5 rounded-full">
                {timeLeft.hours}h {timeLeft.minutes}m
              </span>
            </div>
          </motion.div>
        )}

        {/* Gender Error */}
        {genderError && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed top-32 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="bg-red-500 text-white px-6 py-2 rounded-full shadow-lg">
              {genderError}
            </div>
          </motion.div>
        )}

        {/* Main Content */}
        <div
          className="min-h-screen flex flex-col items-center pt-28 px-6 
                    bg-gradient-to-b from-transparent via-indigo-50/30 to-transparent
                    dark:via-indigo-950/20"
          style={{
            transform: `translate(${mousePosition.x * 0.5}px, ${mousePosition.y * 0.5}px)`,
          }}
        >
          {/* Hero Section - PRIMARY CTA */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="w-full"
          >
            <HeroSection
              socket={socket}
              calculatedStatus={calculatedStatus}
              onStartTextChat={() => handleStartMatching("chat")}
              onStartVoiceChat={() => handleStartMatching("audio")}
            />
          </motion.div>

          {/* Live Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-6xl mt-16"
          >
            <LiveStats socket={socket} />
          </motion.div>

          {/* Feature Cards */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-6xl mt-24"
          >
            <FeatureCards />
          </motion.div>

          {/* Testimonials */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-6xl mt-24"
          >
            <Testimonials />
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="w-full mt-24"
          >
            <Header />
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <AnimatePresence>
          {showScrollIndicator && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-40"
            >
              <div className="flex flex-col items-center gap-2">
                <span className="text-xs text-slate-400">Scroll to explore</span>
                <div className="w-5 h-8 border-2 border-indigo-300 
                              rounded-full flex justify-center">
                  <div className="w-1 h-2 bg-indigo-400 rounded-full 
                                animate-bounce mt-2" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Quick Match */}
        <div className="md:hidden fixed bottom-6 right-6 z-40">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleStartMatching("chat")}
            className="w-14 h-14 bg-indigo-600 rounded-full shadow-2xl
                       flex items-center justify-center text-white text-2xl
                       hover:bg-indigo-500 transition-colors"
          >
            💬
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Home;