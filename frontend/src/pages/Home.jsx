import React, { useRef, useState, useEffect } from "react";
import { io } from "socket.io-client";

import StatBar from "../components/StatBar";
import Matching from "./Matching";
import Chat from "./Chat";

import heroImg from "../assets/heroS.png";
import Header from "../components/Header";

const Home = () => {
  const [stage, setStage] = useState("home");
  const [socket, setSocket] = useState(null);
  const [mode, setMode] = useState("chat"); // chat | audio
  const [matchId, setMatchId] = useState(null); // ✅ IMPORTANT

  const socketRef = useRef(null);

  // 🔌 SOCKET INIT
  useEffect(() => {
    const s = io(import.meta.env.VITE_SOCKET_URL, {
      transports: ["websocket"],
      withCredentials: true,
    });

    socketRef.current = s;
    setSocket(s);

    return () => s.disconnect();
  }, []);

  const startMatching = () => {
    setMatchId(null); // 🔄 reset old match
    setStage("matching");
  };

  /* 🔁 MATCHING SCREEN */
  if (stage === "matching" && socket) {
    return (
      <Matching
        socket={socket}
        mode={mode}
        onMatched={(id) => {
          console.log("✅ MATCH FOUND:", id);
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
        matchId={matchId} // 🔥 PASS MATCH ID
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
      <div className="fixed top-4 left-4 z-50">
        <span className="text-lg font-bold text-white">
          ♟ MatchMate
        </span>
      </div>

      {/* 🏠 PAGE */}
      <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex flex-col items-center justify-center pt-28 px-4 text-white">
        {/* HERO CARD */}
        <div
          className="relative w-full max-w-5xl
                     h-[420px] sm:h-[480px] md:h-[520px]
                     rounded-[32px] overflow-hidden
                     shadow-[0_40px_80px_rgba(0,0,0,0.75)]"
        >
          <img
            src={heroImg}
            alt="Anonymous people chatting"
            className="w-full h-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/70 to-slate-950/30" />

          <div className="absolute top-10 left-6 right-6 sm:left-10 sm:max-w-md">
            <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight">
              Talk Freely.
              <br />
              <span className="bg-gradient-to-r from-sky-400 to-indigo-500 bg-clip-text text-transparent">
                Stay Anonymous.
              </span>
            </h1>

            <p className="mt-3 text-sm sm:text-base text-white/85">
              Meet random people worldwide. No login. No profile.
              Just honest conversations.
            </p>

            <div className="mt-4">
              {socket && <StatBar socket={socket} />}
            </div>
          </div>
        </div>

        <br />

        {/* 🔽 CTA SECTION */}
        <div className="flex flex-col items-center text-center gap-3">
          <button
            onClick={() => {
              setMode("chat");
              startMatching();
            }}
            className="px-8 py-3 rounded-md text-sm font-medium
                       bg-indigo-600 text-white
                       hover:bg-indigo-700"
          >
            Start Random Chat
          </button>

          <button
            onClick={() => {
              setMode("audio");
              startMatching();
            }}
            className="px-8 py-3 rounded-md text-sm font-medium
                       bg-indigo-600 text-white
                       hover:bg-indigo-700"
          >
            Start Audio Call
          </button>

          <Header />
        </div>
      </div>
    </>
  );
};

export default Home;
