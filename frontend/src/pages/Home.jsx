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

  /* =======================
     LANDING PAGE
  ======================= */

  return (
    <>
      {/* Logo */}
      <div className="absolute top-4 left-4 z-50">
        <span className="text-lg font-bold text-slate-900 dark:text-white">
          ♟ MatchMate
        </span>
      </div>

      {/* Theme */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="min-h-screen flex flex-col items-center justify-center pt-28 px-4 bg-gradient-to-br from-white to-slate-100 dark:from-slate-950 dark:to-slate-900 text-slate-900 dark:text-white">

        {/* HERO */}
        <div className="relative w-full max-w-5xl h-[500px] rounded-[32px] overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.75)]">
          <img
            src={heroImg}
            alt="Anonymous chat"
            className="w-full h-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-white/90 via-white/70 to-white/20 dark:from-slate-950/95 dark:via-slate-950/70 dark:to-slate-950/30" />

          <div className="absolute top-14 left-8 sm:left-12 max-w-md">
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight">
              Feeling bored?
              <br />
              <span className="bg-gradient-to-r from-indigo-500 to-sky-500 bg-clip-text text-transparent">
                Talk to someone real.
              </span>
            </h1>

            <p className="mt-4 text-base text-slate-600 dark:text-white/85">
              No login. No identity. Just honest conversations.
            </p>

            <div className="mt-4">
              {socket && <StatBar socket={socket} />}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-10 flex flex-col items-center gap-4">
          <button
            onClick={() => startMatching("chat")}
            className="px-10 py-3 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 transition shadow-lg"
          >
            💬 Start Text Chat
          </button>

          <button
            onClick={() => startMatching("audio")}
            className="px-10 py-3 rounded-xl text-sm font-medium text-white bg-slate-800 hover:bg-slate-700 transition shadow-lg"
          >
            🎧 Start Voice Call
          </button>
        </div>

        {/* TRUST SECTION */}
        <div className="mt-16 max-w-4xl text-center space-y-6">
          <h3 className="text-xl font-semibold">
            Why MatchMate?
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
            <div className="bg-white/5 p-6 rounded-xl backdrop-blur-lg shadow-md">
              🔒 100% Anonymous
              <p className="opacity-60 mt-2">
                We don’t store profiles or personal data.
              </p>
            </div>

            <div className="bg-white/5 p-6 rounded-xl backdrop-blur-lg shadow-md">
              ⚡ Instant Matching
              <p className="opacity-60 mt-2">
                Connect within seconds.
              </p>
            </div>

            <div className="bg-white/5 p-6 rounded-xl backdrop-blur-lg shadow-md">
              🎧 Real Conversations
              <p className="opacity-60 mt-2">
                Text or voice — your choice.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10">
          <Header />
        </div>
      </div>
    </>
  );
};

export default Home;
