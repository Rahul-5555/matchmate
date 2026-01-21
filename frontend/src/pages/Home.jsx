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
  const socketRef = useRef(null);

  // 🔌 SOCKET INIT (UNCHANGED)
  useEffect(() => {
    const s = io(import.meta.env.VITE_SOCKET_URL, {
      transports: ["websocket"],
      withCredentials: true,
    });

    socketRef.current = s;
    setSocket(s);

    return () => s.disconnect();
  }, []);

  const startMatching = () => setStage("matching");

  if (stage === "matching" && socket) {
    return <Matching socket={socket} onMatched={() => setStage("chat")} />;
  }

  if (stage === "chat" && socket) {
    return <Chat socket={socket} onEnd={() => setStage("matching")} />;
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
          {/* IMAGE */}
          <img
            src={heroImg}
            alt="Anonymous people chatting"
            className="w-full h-full object-cover"
          />

          {/* OVERLAY */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/70 to-slate-950/30" />

          {/* HERO TEXT (ONLY TEXT INSIDE IMAGE) */}
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

        {/* 🔽 CTA SECTION (OUTSIDE IMAGE) */}
        <div className="flex flex-col items-center text-center gap-3">
          <button
            onClick={startMatching}
            className="px-8 py-3 rounded-md text-sm font-medium
             bg-indigo-600 text-white
             hover:bg-indigo-700"
          >
            Start Random Chat
          </button>



          {/* 🎥 VIDEO COMING SOON */}
          <span className="text-sm text-white/70">
            🎥 Video call coming soon
          </span>
        </div>


        <Header />
      </div>
    </>
  );
};

export default Home;
