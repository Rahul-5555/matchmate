import dotenv from "dotenv";
dotenv.config();

import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { createClient } from "redis";
import crypto from "crypto";

/* =======================
   CONFIG
======================= */

const DAILY_LIMIT = 3;
const REPEAT_BLOCK_TIME = 60 * 60; // 60 minutes (seconds)
const PORT = process.env.PORT || 5000;

/* =======================
   REDIS SETUP
======================= */

const redis = createClient({
  url: process.env.REDIS_URL || "redis://127.0.0.1:6379",
});

redis.on("error", (err) => {
  console.error("Redis Error:", err);
});

await redis.connect();
console.log("✅ Redis Connected");

/* =======================
   EXPRESS SETUP
======================= */

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://matchmatee.netlify.app",
    ],
    methods: ["GET", "POST"],
  })
);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://matchmatee.netlify.app",
    ],
    methods: ["GET", "POST"],
  },
  transports: ["websocket"],
});

/* =======================
   MEMORY STATE
======================= */

const onlineUsers = new Set();
const userPairs = new Map();
const userRooms = new Map();
const matchTimers = new Map();

/* =======================
   REDIS HELPERS
======================= */

const queueKey = (interest) => {
  return `match:queue:${interest || "global"}`;
};


const addToQueue = async (socketId, interest) => {
  await redis.lPush(queueKey(interest), socketId);
};


const removeFromQueue = async (socketId) => {
  const keys = await redis.keys("match:queue:*");

  for (const key of keys) {
    await redis.lRem(key, 0, socketId);
  }
};


const incrementMatchCount = async (sessionId) => {
  const key = `daily_limit:${sessionId}`;
  const count = await redis.incr(key);

  if (count === 1) {
    await redis.expire(key, 24 * 60 * 60);
  }

  return count;
};

const getMatchCount = async (sessionId) => {
  const count = await redis.get(`daily_limit:${sessionId}`);
  return parseInt(count || "0");
};

/* ===== Temporary Repeat Block ===== */

const storeRecentMatch = async (session1, session2) => {
  await redis.sAdd(`recent:${session1}`, session2);
  await redis.expire(`recent:${session1}`, REPEAT_BLOCK_TIME);

  await redis.sAdd(`recent:${session2}`, session1);
  await redis.expire(`recent:${session2}`, REPEAT_BLOCK_TIME);
};

const isRecentlyMatched = async (session1, session2) => {
  const result = await redis.sIsMember(`recent:${session1}`, session2);
  return result === 1;
};

/* =======================
   MATCHING LOGIC
======================= */

const tryMatch = async (interest) => {
  try {
    const key = queueKey(interest);

    let queueLength = await redis.lLen(key);
    console.log("Queue:", key, "Length:", queueLength);

    if (queueLength < 2) return;

    let user1 = null;
    let user2 = null;

    // 🔎 Find first valid connected user
    while (!user1) {
      const candidate = await redis.rPop(key);
      if (!candidate) return;

      if (io.sockets.sockets.has(candidate)) {
        user1 = candidate;
      }
    }

    // 🔎 Find second valid connected user
    while (!user2) {
      const candidate = await redis.rPop(key);
      if (!candidate) {
        // Put user1 back if no partner found
        await redis.lPush(key, user1);
        return;
      }

      if (io.sockets.sockets.has(candidate) && candidate !== user1) {
        user2 = candidate;
      }
    }

    const matchId = `match_${crypto.randomUUID()}`;

    // 🧠 Store pairing
    userPairs.set(user1, user2);
    userPairs.set(user2, user1);

    userRooms.set(user1, matchId);
    userRooms.set(user2, matchId);

    // 🏠 Join room
    io.sockets.sockets.get(user1)?.join(matchId);
    io.sockets.sockets.get(user2)?.join(matchId);

    // 📡 Emit event
    io.to(user1).emit("match_found", { matchId, role: "caller" });
    io.to(user2).emit("match_found", { matchId, role: "callee" });

    console.log("✅ Matched:", user1, "↔", user2);

  } catch (error) {
    console.error("Match Error:", error);
  }
};


/* =======================
   END MATCH
======================= */

const clearMatchTimer = (matchId) => {
  if (matchTimers.has(matchId)) {
    clearTimeout(matchTimers.get(matchId));
    matchTimers.delete(matchId);
  }
};

const endMatch = (socketId, reason = "ended") => {
  const matchId = userRooms.get(socketId);
  if (!matchId) return;

  const partnerId = userPairs.get(socketId);

  clearMatchTimer(matchId);

  io.to(matchId).emit("call-ended", { reason });

  setTimeout(() => {
    io.sockets.sockets.get(socketId)?.leave(matchId);
    io.sockets.sockets.get(partnerId)?.leave(matchId);
  }, 100);

  userPairs.delete(socketId);
  userPairs.delete(partnerId);
  userRooms.delete(socketId);
  userRooms.delete(partnerId);
};

/* =======================
   SOCKET CONNECTION
======================= */

io.on("connection", (socket) => {
  const sessionId = socket.handshake.auth?.sessionId;

  if (!sessionId) {
    socket.disconnect(true);
    return;
  }

  socket.sessionId = sessionId;

  console.log("🟢 CONNECT:", socket.id);

  onlineUsers.add(socket.id);
  io.emit("online_count", onlineUsers.size);

  /* ---------- FIND MATCH ---------- */

  socket.on("find_match", async (data) => {
    const interest = data?.interest || "global";

    console.log("Find match called:", socket.id, "Interest:", interest);

    socket.interest = interest;

    const count = await getMatchCount(socket.sessionId);
    if (count >= DAILY_LIMIT) {
      socket.emit("limit_reached");
      return;
    }

    await addToQueue(socket.id, interest);
    await tryMatch(interest);
  });

  /* ---------- SKIP ---------- */

  socket.on("skip", async () => {
    try {
      endMatch(socket.id, "skipped");
      await removeFromQueue(socket.id);

      const currentCount = await getMatchCount(socket.sessionId);

      if (currentCount >= DAILY_LIMIT) {
        socket.emit("limit_reached");
        return;
      }

      await addToQueue(socket.id);
      await tryMatch();

    } catch (error) {
      console.error("Skip Error:", error);
    }
  });

  /* ---------- CHAT ---------- */

  socket.on("send_message", (msg) => {
    const partnerId = userPairs.get(socket.id);
    if (partnerId) {
      io.to(partnerId).emit("receive_message", msg);
    }
  });

  socket.on("typing", () => {
    const partnerId = userPairs.get(socket.id);
    if (partnerId) io.to(partnerId).emit("partner_typing");
  });

  socket.on("stop_typing", () => {
    const partnerId = userPairs.get(socket.id);
    if (partnerId) io.to(partnerId).emit("partner_stop_typing");
  });

  /* ---------- WEBRTC SIGNALING ---------- */

  socket.on("offer", ({ matchId, offer }) => {
    if (userRooms.get(socket.id) === matchId) {
      socket.to(matchId).emit("offer", { offer });
    }
  });

  socket.on("answer", ({ matchId, answer }) => {
    if (userRooms.get(socket.id) === matchId) {
      socket.to(matchId).emit("answer", { answer });
    }
  });

  socket.on("ice-candidate", ({ matchId, candidate }) => {
    if (userRooms.get(socket.id) === matchId) {
      socket.to(matchId).emit("ice-candidate", { candidate });
    }
  });

  /* ---------- MANUAL END ---------- */

  socket.on("call-ended", ({ matchId, reason }) => {
    if (userRooms.get(socket.id) === matchId) {
      endMatch(socket.id, reason || "ended");
    }
  });

  /* ---------- DISCONNECT ---------- */

  socket.on("disconnect", async () => {
    console.log("🔴 DISCONNECT:", socket.id);

    endMatch(socket.id, "disconnect");
    await removeFromQueue(socket.id);

    onlineUsers.delete(socket.id);
    io.emit("online_count", onlineUsers.size);
  });
});

/* =======================
   GLOBAL ERROR HANDLING
======================= */

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
});

/* =======================
   START SERVER
======================= */

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
