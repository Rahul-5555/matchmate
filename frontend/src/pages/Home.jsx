import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import useSocket from "../hooks/useSocket";
import useMatching from "../hooks/useMatching";
import useSocketEvents from "../hooks/useSocketEvents";

// Components
import HeaderSection from "../components/LandingPage/HeaderSection";
import HeroSection from "../components/LandingPage/HeroSection";
import FeatureCards from "../components/LandingPage/FeatureCards";
import InterestModal from "../components/InterestModal";
import Matching from "./Matching";
import Chat from "./Chat";
import Header from "../components/Header";

// New engaging components
import LiveStats from "../components/LandingPage/LiveStats";
import Testimonials from "../components/LandingPage/Testimonials";
// import HowItWorks from "../components/LandingPage/HowItWorks";
// import CTASection from "../components/LandingPage/CTASection";
import BackgroundAnimation from "../components/LandingPage/BackgroundAnimation";

const Home = () => {
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

  // New state for engaging features
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Socket event listeners
  useSocketEvents(socket, handleMatched);

  // Handle mouse move for parallax effects
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

  // Hide scroll indicator after scrolling
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setShowScrollIndicator(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Conditional renders based on stage
  if (stage === "matching" && socket) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Matching socket={socket} onMatched={handleMatched} />
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
        />
      </motion.div>
    );
  }

  // Landing page with engaging design
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

        {/* Interest Modal with animation */}
        <AnimatePresence>
          {showInterestModal && (
            <InterestModal
              isOpen={showInterestModal}
              selectedInterest={selectedInterest}
              setSelectedInterest={setSelectedInterest}
              onClose={closeModal}
              onConfirm={confirmMatching}
            />
          )}
        </AnimatePresence>

        {/* Header with enhanced styling */}
        <HeaderSection />

        {/* Connection Status Badge */}
        {!isConnected && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50"
          >
            <div className="bg-yellow-500 text-white px-6 py-2 rounded-full shadow-lg flex items-center space-x-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span className="text-sm font-medium">Connecting to server...</span>
            </div>
          </motion.div>
        )}

        {/* Main Content with Parallax */}
        <div
          className="min-h-screen flex flex-col items-center pt-28 px-6 
                    bg-gradient-to-b from-transparent via-indigo-50/30 to-transparent
                    dark:via-indigo-950/20"
          style={{
            transform: `translate(${mousePosition.x * 0.5}px, ${mousePosition.y * 0.5}px)`,
          }}
        >
          {/* Hero Section with enhanced animations */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="w-full"
          >
            <HeroSection
              socket={socket}
              calculatedStatus={calculatedStatus}
              onStartTextChat={() => startMatching("chat")}
              onStartVoiceChat={() => startMatching("audio")}
            />
          </motion.div>

          {/* Live Stats Counter */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-6xl mt-20"
          >
            <LiveStats socket={socket} />
          </motion.div>

          {/* How It Works Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-6xl mt-32"
          >
            {/* <HowItWorks /> */}
          </motion.div>

          {/* Feature Cards with staggered animation */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-6xl mt-32"
          >
            <FeatureCards />
          </motion.div>

          {/* Testimonials Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-6xl mt-32"
          >
            <Testimonials />
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-6xl mt-32"
          >
            {/* <CTASection
              onStartTextChat={() => startMatching("chat")}
              onStartVoiceChat={() => startMatching("audio")}
            /> */}
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="w-full mt-32"
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
              <div className="flex flex-col items-center space-y-2">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  Scroll to explore
                </span>
                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="w-6 h-10 border-2 border-indigo-400 dark:border-indigo-500 rounded-full flex justify-center"
                >
                  <motion.div
                    animate={{ y: [0, 12, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="w-1.5 h-1.5 bg-indigo-400 dark:bg-indigo-500 rounded-full mt-2"
                  />
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Action Button for quick matching */}
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => startMatching("chat")}
          className="fixed bottom-8 right-8 z-40 w-14 h-14 bg-indigo-600 hover:bg-indigo-500 
                     rounded-full shadow-2xl flex items-center justify-center
                     transition-all duration-300 group"
        >
          <span className="text-2xl transform group-hover:rotate-12 transition-transform duration-300">
            💬
          </span>
          <span className="absolute -top-12 right-0 bg-slate-900 dark:bg-white text-white dark:text-slate-900 
                         text-sm px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 
                         transition-opacity duration-300 whitespace-nowrap">
            Quick Match
          </span>
        </motion.button>
      </motion.div>
    </AnimatePresence>
  );
};

export default Home;