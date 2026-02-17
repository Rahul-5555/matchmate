import React, { useRef, useState, useEffect } from "react";
import { io } from "socket.io-client";

import StatBar from "../components/StatBar";
import Matching from "./Matching";
import Chat from "../pages/Chat";

import heroImg from "../assets/heroImg.png";
import Header from "../components/Header";
import ThemeToggle from "../components/ThemeToggle";
const Home = () => {

  /* =======================
     SESSION ID
  ======================= */

  const getSessionId = () => {
    let id = localStorage.getItem("matchmate_session");

    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("matchmate_session", id);
    }

    return id;
  };

  /* =======================
     STATE
  ======================= */

  const [stage, setStage] = useState("home");
  const [mode, setMode] = useState("chat");

  const [matchId, setMatchId] = useState(null);
  const [isCaller, setIsCaller] = useState(false);
  const [audioOn, setAudioOn] = useState(false);

  const [socket, setSocket] = useState(null);

  const socketRef = useRef(null);
  const isMatchingRef = useRef(false);


  /* =======================
     SOCKET INIT
  ======================= */

  useEffect(() => {
    const sessionId = getSessionId();

    const s = io(import.meta.env.VITE_SOCKET_URL, {
      transports: ["websocket"],
      auth: { sessionId },
    });

    socketRef.current = s;
    setSocket(s);

    s.on("connect", () => {
      console.log("✅ Connected:", s.id);
    });

    return () => {
      s.disconnect();
      socketRef.current = null;
    };
  }, []);

  /* =======================
     START MATCHING
  ======================= */

  const startMatching = (selectedMode) => {
    if (!socketRef.current || isMatchingRef.current) return;

    isMatchingRef.current = true;

    setMode(selectedMode);
    setMatchId(null);
    setIsCaller(false);
    setAudioOn(false);

    setStage("matching");
    socketRef.current.emit("find_match");
  };

  /* =======================
     MATCH FOUND
  ======================= */

  const handleMatched = ({ matchId, role }) => {
    if (stage !== "matching") return; // safety guard

    isMatchingRef.current = false;
    setMatchId(matchId);
    setIsCaller(role === "caller");

    if (mode === "audio") setAudioOn(true);

    setStage("chat");
  };


  /* =======================
     END CHAT
  ======================= */

  const handleEnd = () => {
    setAudioOn(false);
    setMatchId(null);
    setIsCaller(false);
    isMatchingRef.current = false;

    setStage("home"); // go home only
  };



  /* =======================
     CONDITIONAL RENDER
  ======================= */

  if (stage === "matching" && socket) {
    return <Matching socket={socket} onMatched={handleMatched} />;
  }

  if (stage === "chat" && socket && matchId) {
    return (
      <Chat
        socket={socket}
        mode={mode}
        matchId={matchId}
        audioOn={audioOn}
        setAudioOn={setAudioOn}
        isCaller={isCaller}
        onEnd={handleEnd}
      />
    );
  }


  //  LANDING PAGE

  return (
    <>
      {/* Logo */}
      <div className="absolute top-6 left-6 z-50">
        <span className="text-lg font-semibold text-slate-900 dark:text-white">
          ♟ MatchMate
        </span>
      </div>

      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <div className="min-h-screen flex flex-col items-center pt-28 px-6 
                    bg-white dark:bg-slate-950 
                    text-slate-900 dark:text-white">

        {/* ================= HERO ================= */}
        <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-16 items-center">

          {/* LEFT CONTENT */}
          <div className="space-y-8 md:pr-8 order-2 md:order-1">

            <h1 className="text-4xl sm:text-5xl font-bold leading-tight tracking-tight">
              Meet new people.
              <br />
              <span className="text-indigo-600 dark:text-indigo-400">
                Instantly.
              </span>
            </h1>

            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-md">
              Anonymous conversations. Real humans. Zero pressure.
              Just tap and start talking.
            </p>

            {socket && <StatBar socket={socket} />}

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">

              <button
                onClick={() => startMatching("chat")}
                className="px-8 py-3 rounded-lg text-sm font-medium text-white 
                         bg-indigo-600 hover:bg-indigo-500
                         transition-all duration-300
                         shadow-md hover:shadow-xl hover:-translate-y-1"
              >
                💬 Start Text Chat
              </button>

              <button
                onClick={() => startMatching("audio")}
                className="px-8 py-3 rounded-lg text-sm font-medium 
                         border border-slate-300 dark:border-slate-700
                         hover:bg-slate-100 dark:hover:bg-slate-800
                         transition-all duration-300"
              >
                🎧 Start Voice Call
              </button>

            </div>
          </div>

          {/* RIGHT IMAGE */}
          <div className="flex justify-center order-1 md:order-2">

            <div className="
            w-full max-w-md md:max-w-lg
            rounded-2xl 
            overflow-hidden 
            shadow-2xl 
            border border-slate-200 dark:border-slate-800
            bg-white dark:bg-slate-900
            transition duration-300
            hover:shadow-3xl
          ">

              <img
                alt="hero"
                src={heroImg}
                className="w-full h-auto object-contain"
              />

            </div>

          </div>

        </div>

        {/* ================= TRUST SECTION ================= */}
        <div className="mt-40 w-full max-w-6xl">

          {/* Section Header */}
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold tracking-tight">
              Why people love MatchMate
            </h3>
            <p className="mt-4 text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
              Designed for meaningful conversations without pressure.
              Simple, fast and completely anonymous.
            </p>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">

            {/* Card 1 */}
            <div className="
            group p-8 rounded-2xl 
            bg-white dark:bg-slate-900 
            border border-slate-200 dark:border-slate-800
            transition-all duration-300
            hover:shadow-2xl hover:-translate-y-2
            text-center
          ">

              <div className="
              w-14 h-14 mx-auto
              flex items-center justify-center 
              rounded-xl bg-indigo-50 dark:bg-indigo-900/30
              text-2xl mb-6
            ">
                🔒
              </div>

              <h4 className="font-semibold text-lg mb-3">
                100% Anonymous
              </h4>

              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                No accounts. No tracking. No saved history.
                Just honest conversations.
              </p>
            </div>

            {/* Card 2 */}
            <div className="
            group p-8 rounded-2xl 
            bg-white dark:bg-slate-900 
            border border-slate-200 dark:border-slate-800
            transition-all duration-300
            hover:shadow-2xl hover:-translate-y-2
            text-center
          ">

              <div className="
              w-14 h-14 mx-auto
              flex items-center justify-center 
              rounded-xl bg-indigo-50 dark:bg-indigo-900/30
              text-2xl mb-6
            ">
                ⚡
              </div>

              <h4 className="font-semibold text-lg mb-3">
                Instant Matching
              </h4>

              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                Connect with someone new in seconds.
                No waiting. No setup.
              </p>
            </div>

            {/* Card 3 */}
            <div className="
            group p-8 rounded-2xl 
            bg-white dark:bg-slate-900 
            border border-slate-200 dark:border-slate-800
            transition-all duration-300
            hover:shadow-2xl hover:-translate-y-2
            text-center
          ">

              <div className="
              w-14 h-14 mx-auto
              flex items-center justify-center 
              rounded-xl bg-indigo-50 dark:bg-indigo-900/30
              text-2xl mb-6
            ">
                🎧
              </div>

              <h4 className="font-semibold text-lg mb-3">
                Real Conversations
              </h4>

              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                Choose text or voice.
                Talk freely and naturally.
              </p>
            </div>

          </div>
        </div>

        {/* Footer / Header Component */}
        <div className="mt-40">
          <Header />
        </div>

      </div>
    </>
  );




};

export default Home;
