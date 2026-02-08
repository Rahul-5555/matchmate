import React, { useRef, useState, useEffect } from "react";
import { io } from "socket.io-client";

import StatBar from "../components/StatBar";
import Matching from "./Matching";
import Chat from "../pages/Chat";

import heroImg from "../assets/heroS.png";
import Header from "../components/Header";
import ThemeToggle from "../components/ThemeToggle";

const Home = () => {
  /* =======================
     APP FLOW STATE
  ======================= */
  const [stage, setStage] = useState("home"); // home | matching | chat
  const [mode, setMode] = useState("chat");   // chat | audio

  const [matchId, setMatchId] = useState(null);
  const [isCaller, setIsCaller] = useState(false);
  const [audioOn, setAudioOn] = useState(false);

  const [socket, setSocket] = useState(null);

  const socketRef = useRef(null);
  const isMatchingRef = useRef(false); // 🔥 prevents double match

  /* =======================
     SOCKET INIT (ONCE)
  ======================= */
  useEffect(() => {
    const s = io(import.meta.env.VITE_SOCKET_URL, {
      transports: ["polling", "websocket"],
      withCredentials: true,
    });

    socketRef.current = s;
    setSocket(s);

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
    isMatchingRef.current = false;

    setMatchId(matchId);
    setIsCaller(role === "caller");

    if (mode === "audio") {
      setAudioOn(true);
    }

    setStage("chat");
  };

  /* =======================
     END CHAT / SKIP
  ======================= */
  const handleEnd = () => {
    if (socketRef.current) {
      socketRef.current.emit("skip");
    }

    setAudioOn(false);
    setMatchId(null);
    setIsCaller(false);

    isMatchingRef.current = false;
    setStage("matching");
  };

  /* =======================
     MATCHING SCREEN
  ======================= */
  if (stage === "matching" && socket) {
    return (
      <Matching
        socket={socket}
        onMatched={handleMatched}
      />
    );
  }

  /* =======================
     CHAT / AUDIO SCREEN
  ======================= */
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

  /* =======================
     LANDING PAGE
  ======================= */
  return (
    <>
      {/* LOGO */}
      <div className="absolute top-4 left-4 z-50">
        <span className="text-lg font-bold text-slate-900 dark:text-white">
          ♟ MatchMate
        </span>
      </div>

      {/* THEME TOGGLE */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div
        className="
          min-h-screen
          flex flex-col items-center justify-center
          pt-28 px-4
          bg-gradient-to-br
          from-white to-slate-100
          dark:from-slate-950 dark:to-slate-900
          text-slate-900 dark:text-white
        "
      >
        {/* HERO */}
        <div
          className="
            relative w-full max-w-5xl
            h-[420px] sm:h-[480px] md:h-[520px]
            rounded-[32px] overflow-hidden
            shadow-[0_40px_80px_rgba(0,0,0,0.75)]
          "
        >
          <img
            src={heroImg}
            alt="Anonymous people chatting"
            className="w-full h-full object-cover"
          />

          <div
            className="
              absolute inset-0
              bg-gradient-to-r
              from-white/90 via-white/60 to-white/20
              dark:from-slate-950/95 dark:via-slate-950/70 dark:to-slate-950/30
            "
          />

          <div className="absolute top-10 left-6 right-6 sm:left-10 sm:max-w-md">
            <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight">
              Talk Freely.
              <br />
              <span
                className="
                  bg-gradient-to-r
                  from-indigo-500 to-sky-500
                  dark:from-sky-400 dark:to-indigo-500
                  bg-clip-text text-transparent
                "
              >
                Stay Anonymous.
              </span>
            </h1>

            <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-white/85">
              Talk to real people anonymously. No login. No profile. Leave anytime.
            </p>

            {/* TRUST SIGNAL */}
            <p className="mt-2 text-xs text-slate-500 dark:text-white/60">
              🔒 Private • No profiles • Instant disconnect
            </p>

            <div className="mt-4">
              {socket && <StatBar socket={socket} />}
            </div>
          </div>
        </div>

        <div className="h-6" />

        {/* CTA */}
        <div className="flex flex-col items-center text-center gap-3">
          <button
            onClick={() => startMatching("chat")}
            className="
              px-9 py-3 rounded-xl text-sm font-medium
              text-white bg-slate-800
              hover:bg-slate-700 transition
            "
          >
            💬 Text Chat (Instant)
          </button>

          <button
            onClick={() => startMatching("audio")}
            className="
              px-9 py-3 rounded-xl text-sm font-medium
              text-white bg-slate-800
              hover:bg-slate-700 transition
            "
          >
            🎧 Voice Call (More real)
          </button>

          <Header />
        </div>
      </div>
    </>
  );
};

export default Home;
