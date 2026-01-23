import React, { useRef, useState, useEffect } from "react";
import { io } from "socket.io-client";

import StatBar from "../components/StatBar";
import Matching from "./Matching";
import Chat from "../pages/Chat";

import heroImg from "../assets/heroS.png";
import Header from "../components/Header";
import ThemeToggle from "../components/ThemeToggle";
import TypingText from "../components/TypingText";

const Home = () => {
  const [stage, setStage] = useState("home");
  const [socket, setSocket] = useState(null);
  const [mode, setMode] = useState("chat"); // chat | audio
  const [matchId, setMatchId] = useState(null);

  const socketRef = useRef(null);

  /* 🔌 SOCKET INIT */
  useEffect(() => {
    const s = io(import.meta.env.VITE_SOCKET_URL, {
      transports: ["polling", "websocket"],
      withCredentials: true,
    });

    socketRef.current = s;
    setSocket(s);

    return () => s.disconnect();
  }, []);

  const startMatching = () => {
    setMatchId(null);
    setStage("matching");
  };

  /* 🔁 MATCHING SCREEN */
  if (stage === "matching" && socket) {
    return (
      <Matching
        socket={socket}
        mode={mode}
        onMatched={(id) => {
          setMatchId(id);
          setStage("chat");
        }}
      />
    );
  }

  /* 💬 CHAT / AUDIO SCREEN */
  if (stage === "chat" && socket && matchId) {
    return (
      <Chat
        socket={socket}
        mode={mode}
        matchId={matchId}
        onEnd={() => {
          setMatchId(null);
          setStage("matching");
        }}
      />
    );
  }

  return (
    <>
      {/* 🔰 LOGO */}
      <div className="absolute top-4 left-4 z-50">
        <span className="text-lg font-bold text-slate-900 dark:text-white">
          ♟ MatchMate
        </span>
      </div>

      {/* 🌗 THEME TOGGLE */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* 🏠 PAGE */}
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
        {/* HERO CARD */}
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

          {/* THEME-AWARE OVERLAY */}
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

            <p className="
    mt-3 text-sm sm:text-base
    text-slate-600 dark:text-white/85
    animate-fadeIn
  ">Meet random people worldwide. No login. No profile. Just honest conversations.
            </p>
            {/* <TypingText text="Meet random people worldwide. No login. No profile. Just honest conversations."/> */}

            <div className="mt-4">
              {socket && <StatBar socket={socket} />}
            </div>
          </div>
        </div>

        <div className="h-6" />

        {/* 🔽 CTA SECTION */}
        <div className="flex flex-col items-center text-center gap-3">
          {/* 💬 START CHAT */}
          <button
            onClick={() => {
              setMode("chat");
              startMatching();
            }}
            className="
              group relative overflow-hidden
              px-9 py-3 rounded-xl
              text-sm font-medium
              text-white
              bg-slate-800
              border border-white/10
              shadow-md
              transition-all duration-200
              hover:bg-slate-700
              hover:scale-[1.02]
              active:scale-95
            "
          >
            <span className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition" />
            <span className="relative flex items-center gap-2">
              💬 Start Random Chat
              <span className="opacity-60 group-hover:translate-x-1 transition">
                →
              </span>
            </span>
          </button>

          {/* 🎧 START AUDIO */}
          <button
            onClick={() => {
              setMode("audio");
              startMatching();
            }}
            className="
              group relative overflow-hidden
              px-9 py-3 rounded-xl
              text-sm font-medium
              text-white
              bg-slate-800
              border border-white/10
              shadow-md
              transition-all duration-200
              hover:bg-slate-700
              hover:scale-[1.02]
              active:scale-95
            "
          >
            <span className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition" />
            <span className="relative flex items-center gap-2">
              🎧 Start Audio Call
              <span className="opacity-60 group-hover:translate-x-1 transition">
                →
              </span>
            </span>
          </button>

          <Header />
        </div>
      </div>
    </>
  );
};

export default Home;
