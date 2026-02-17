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
const REPEAT_BLOCK_TIME = 60 * 60; // 60 minutes
const PORT = process.env.PORT || 5000;

/* =======================
   REDIS
======================= */

const redis = createClient({
  url: process.env.REDIS_URL || "redis://127.0.0.1:6379",
});

redis.on("error", (err) => console.error("Redis Error:", err));
await redis.connect();
console.log("✅ Redis Connected");

/* =======================
   EXPRESS
======================= */

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://matchmatee.netlify.app",
    ],
  })
);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://matchmatee.netlify.app",
    ],
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

const queueKey = (interest) => `match:queue:${interest || "global"}`;

const addToQueue = async (socketId, interest) => {
  await redis.lPush(queueKey(interest), socketId);
};

const removeFromAllQueues = async (socketId) => {
  const keys = await redis.keys("match:queue:*");
  for (const key of keys) {
    await redis.lRem(key, 0, socketId);
  }
};

const incrementMatchCount = async (sessionId) => {
  const key = `daily_limit:${sessionId}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 24 * 60 * 60);
  return count;
};

const getMatchCount = async (sessionId) => {
  const count = await redis.get(`daily_limit:${sessionId}`);
  return parseInt(count || "0");
};

const storeRecentMatch = async (s1, s2) => {
  await redis.sAdd(`recent:${s1}`, s2);
  await redis.expire(`recent:${s1}`, REPEAT_BLOCK_TIME);

  await redis.sAdd(`recent:${s2}`, s1);
  await redis.expire(`recent:${s2}`, REPEAT_BLOCK_TIME);
};

const isRecentlyMatched = async (s1, s2) => {
  return (await redis.sIsMember(`recent:${s1}`, s2)) === 1;
};

/* =======================
   SMART MATCH
======================= */

const tryMatch = async (interest) => {
  try {
    const key = queueKey(interest);
    let queueLength = await redis.lLen(key);
    if (queueLength < 2) return;

    const user1 = await redis.rPop(key);
    if (!user1) return;

    let candidate = null;

    for (let i = 0; i < queueLength - 1; i++) {
      const possible = await redis.rPop(key);
      if (!possible || possible === user1) continue;

      const s1 = io.sockets.sockets.get(user1);
      const s2 = io.sockets.sockets.get(possible);
      if (!s1 || !s2) continue;

      const blocked = await isRecentlyMatched(
        s1.sessionId,
        s2.sessionId
      );

      if (!blocked) {
        candidate = possible;
        break;
      } else {
        await redis.lPush(key, possible);
      }
    }

    if (!candidate) {
      await redis.lPush(key, user1);
      return;
    }

    const matchId = `match_${crypto.randomUUID()}`;

    userPairs.set(user1, candidate);
    userPairs.set(candidate, user1);

    userRooms.set(user1, matchId);
    userRooms.set(candidate, matchId);

    io.sockets.sockets.get(user1)?.join(matchId);
    io.sockets.sockets.get(candidate)?.join(matchId);

    io.to(user1).emit("match_found", { matchId, role: "caller" });
    io.to(candidate).emit("match_found", { matchId, role: "callee" });

    const s1 = io.sockets.sockets.get(user1);
    const s2 = io.sockets.sockets.get(candidate);

    if (s1?.sessionId && s2?.sessionId) {
      await storeRecentMatch(s1.sessionId, s2.sessionId);
      await incrementMatchCount(s1.sessionId);
      await incrementMatchCount(s2.sessionId);
    }

    const timer = setTimeout(() => {
      endMatch(user1, "timeout");
    }, 10 * 60 * 1000);

    matchTimers.set(matchId, timer);

  } catch (err) {
    console.error("Match Error:", err);
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
   SOCKET
======================= */

io.on("connection", (socket) => {
  const sessionId = socket.handshake.auth?.sessionId;
  if (!sessionId) return socket.disconnect(true);

  socket.sessionId = sessionId;
  onlineUsers.add(socket.id);
  io.emit("online_count", onlineUsers.size);

  socket.on("find_match", async ({ interest }) => {
    try {
      const count = await getMatchCount(socket.sessionId);
      if (count >= DAILY_LIMIT) {
        socket.emit("limit_reached");
        return;
      }

      socket.interest = interest || "global";

      await addToQueue(socket.id, socket.interest);
      await tryMatch(socket.interest);

      // Fallback to global if no match
      await tryMatch("global");

    } catch (err) {
      console.error(err);
    }
  });

  socket.on("skip", async () => {
    endMatch(socket.id, "skipped");
    await removeFromAllQueues(socket.id);
    await addToQueue(socket.id, socket.interest || "global");
    await tryMatch(socket.interest || "global");
  });

  socket.on("disconnect", async () => {
    endMatch(socket.id, "disconnect");
    await removeFromAllQueues(socket.id);
    onlineUsers.delete(socket.id);
    io.emit("online_count", onlineUsers.size);
  });
});

/* =======================
   START
======================= */

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
