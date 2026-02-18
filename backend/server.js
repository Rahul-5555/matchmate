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
const REPEAT_BLOCK_TIME = 0; // 0 for testing
const MATCH_TIMEOUT = 10 * 60 * 1000; // 10 minutes
const PORT = process.env.PORT || 5000;

/* =======================
   REDIS SETUP
======================= */

const redis = createClient({
  url: process.env.REDIS_URL || "redis://127.0.0.1:6379",
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error("❌ Too many Redis reconnection attempts");
        return new Error("Redis connection failed");
      }
      return Math.min(retries * 100, 3000);
    }
  }
});

redis.on("error", (err) => {
  console.error("⚠️ Redis Error:", err.message);
});

redis.on("connect", () => {
  console.log("✅ Redis Connected");
});

redis.on("reconnecting", () => {
  console.log("🔄 Redis Reconnecting...");
});

try {
  await redis.connect();
} catch (err) {
  console.error("❌ Failed to connect to Redis:", err);
  process.exit(1);
}

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
    credentials: true
  })
);

app.use(express.json());

// Health check endpoint
app.get("/", (req, res) => {
  res.json({
    name: "MatchMate API",
    status: "running",
    version: "1.0.0",
    timestamp: new Date().toISOString()
  });
});

app.get("/health", async (req, res) => {
  try {
    await redis.ping();
    res.json({
      status: "healthy",
      redis: "connected",
      onlineUsers: onlineUsers.size,
      activeChats: Math.floor(userPairs.size / 2),
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      status: "unhealthy",
      redis: "disconnected",
      error: err.message
    });
  }
});

app.get("/stats", async (req, res) => {
  try {
    const totalMatches = await redis.get("stats:total_matches") || 0;
    const keys = await redis.keys("match:queue:*");
    const queues = {};

    for (const key of keys) {
      const length = await redis.lLen(key);
      queues[key.replace("match:queue:", "")] = length;
    }

    res.json({
      onlineUsers: onlineUsers.size,
      activeChats: Math.floor(userPairs.size / 2),
      totalMatches: parseInt(totalMatches),
      queues,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const server = http.createServer(app);
server.setMaxListeners(20);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "https://matchmatee.netlify.app"],
    credentials: true
  },
  transports: ["websocket", "polling"],
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 10000,
  allowEIO3: true,
  maxHttpBufferSize: 1e6
});

/* =======================
   MEMORY STATE
======================= */

const onlineUsers = new Set();
const userPairs = new Map(); // socketId -> partnerId
const userRooms = new Map(); // socketId -> roomId
const matchTimers = new Map(); // matchId -> timer
const userInterests = new Map(); // socketId -> interest
const userSessionMap = new Map(); // sessionId -> socketId

/* =======================
   STATS VARIABLES
======================= */

let activeUsers = 0;
let totalMatches = 0;
let messagesSent = 0;

// Broadcast stats every 5 seconds
setInterval(() => {
  io.emit("stats_update", {
    activeUsers,
    totalMatches,
    messagesSent,
    avgResponseTime: "1.2s"
  });
}, 5000);

/* =======================
   REDIS HELPERS
======================= */

const queueKey = (interest) => `match:queue:${interest || "global"}`;

const addToQueue = async (socketId, interest) => {
  await redis.lPush(queueKey(interest), socketId);
  console.log(`📥 Added to queue ${interest}: ${socketId}`);
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
    console.log(`📊 Queue ${interest}: ${queueLength} users`);

    if (queueLength < 2) return;

    const users = await redis.lRange(key, 0, -1);
    const validUsers = [];

    for (const userId of users) {
      const socket = io.sockets.sockets.get(userId);
      if (socket && !userPairs.has(userId)) {
        validUsers.push(userId);
      } else {
        await redis.lRem(key, 1, userId);
      }
    }

    if (validUsers.length < 2) return;

    for (let i = validUsers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [validUsers[i], validUsers[j]] = [validUsers[j], validUsers[i]];
    }

    for (let i = 0; i < validUsers.length - 1; i++) {
      for (let j = i + 1; j < validUsers.length; j++) {
        const user1 = validUsers[i];
        const user2 = validUsers[j];

        const socket1 = io.sockets.sockets.get(user1);
        const socket2 = io.sockets.sockets.get(user2);

        if (!socket1 || !socket2) continue;

        const blocked = await isRecentlyMatched(
          socket1.sessionId,
          socket2.sessionId
        );

        if (!blocked) {
          console.log(`✅ Match found: ${user1} <-> ${user2}`);

          await redis.lRem(key, 1, user1);
          await redis.lRem(key, 1, user2);

          await createMatch(user1, user2, interest);
          return;
        }
      }
    }

    console.log(`🔄 No compatible match found for ${interest}`);

  } catch (error) {
    console.error("❌ Match Error:", error);
  }
};

/* =======================
   CREATE MATCH
======================= */

const createMatch = async (user1, user2, interest) => {
  try {
    const matchId = `match_${crypto.randomUUID()}`;

    userPairs.set(user1, user2);
    userPairs.set(user2, user1);
    userRooms.set(user1, matchId);
    userRooms.set(user2, matchId);

    const socket1 = io.sockets.sockets.get(user1);
    const socket2 = io.sockets.sockets.get(user2);

    if (!socket1 || !socket2) {
      console.log("⚠️ Socket not found for match");
      return false;
    }

    await socket1.join(matchId);
    await socket2.join(matchId);

    userSessionMap.set(socket1.sessionId, user1);
    userSessionMap.set(socket2.sessionId, user2);

    socket1.emit("match_found", {
      matchId,
      role: "caller",
      partnerId: user2
    });

    socket2.emit("match_found", {
      matchId,
      role: "callee",
      partnerId: user1
    });

    await redis.hSet(`match:${matchId}`, {
      user1: user1,
      user2: user2,
      user1Session: socket1.sessionId,
      user2Session: socket2.sessionId,
      interest: interest || "global",
      startedAt: Date.now().toString()
    });
    await redis.expire(`match:${matchId}`, 3600);

    const timer = setTimeout(() => {
      endMatch(user1, "timeout");
    }, MATCH_TIMEOUT);

    matchTimers.set(matchId, timer);

    // Update stats
    totalMatches++;
    await redis.incr("stats:total_matches");
    await storeRecentMatch(socket1.sessionId, socket2.sessionId);
    await incrementMatchCount(socket1.sessionId);
    await incrementMatchCount(socket2.sessionId);

    // Broadcast updated stats
    io.emit("total_matches", totalMatches);
    io.emit("stats_update", {
      activeUsers,
      totalMatches,
      messagesSent,
      avgResponseTime: "1.2s"
    });

    console.log(`✅ Match created: ${matchId}`);
    return true;

  } catch (error) {
    console.error("❌ Create Match Error:", error);
    return false;
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

const endMatch = async (socketId, reason = "ended") => {
  try {
    const matchId = userRooms.get(socketId);
    if (!matchId) return;

    const partnerId = userPairs.get(socketId);

    clearMatchTimer(matchId);

    io.to(matchId).emit("partner_disconnected", {
      reason,
      message: reason === "timeout" ? "Call time limit reached" : "Partner disconnected"
    });

    io.to(matchId).emit("call-ended", { reason });

    setTimeout(() => {
      io.sockets.sockets.get(socketId)?.leave(matchId);
      io.sockets.sockets.get(partnerId)?.leave(matchId);
    }, 100);

    userPairs.delete(socketId);
    userPairs.delete(partnerId);
    userRooms.delete(socketId);
    userRooms.delete(partnerId);

    await removeFromQueue(socketId);
    if (partnerId) await removeFromQueue(partnerId);

    if (matchId) {
      await redis.hSet(`match:${matchId}`, "endedAt", Date.now().toString());
      await redis.hSet(`match:${matchId}`, "endReason", reason);
    }

    console.log(`✅ Match ended: ${socketId} & ${partnerId}, reason: ${reason}`);

  } catch (error) {
    console.error("❌ End Match Error:", error);
  }
};

/* =======================
   SOCKET CONNECTION
======================= */

io.on("connection", (socket) => {
  const sessionId = socket.handshake.auth?.sessionId ||
    socket.handshake.headers?.['x-session-id'] ||
    crypto.randomUUID();

  socket.sessionId = sessionId;
  userSessionMap.set(sessionId, socket.id);

  if (!onlineUsers.has(socket.id)) {
    onlineUsers.add(socket.id);
    activeUsers++;
  }

  console.log(`🟢 CONNECT: ${socket.id}, Session: ${sessionId.substring(0, 8)}...`);
  console.log(`👥 Online users: ${onlineUsers.size}`);

  // Send initial stats
  socket.emit("stats_update", {
    activeUsers,
    totalMatches,
    messagesSent,
    avgResponseTime: "1.2s"
  });

  socket.emit("session_ready", { sessionId });

  setTimeout(() => {
    io.emit("online_count", onlineUsers.size);
    io.emit("active_users", activeUsers);
  }, 100);

  /* ---------- FIND MATCH ---------- */
  socket.on("find_match", async (data) => {
    try {
      if (!socket.connected) return;

      const interest = data?.interest || "global";
      console.log(`🔍 Find match: ${socket.id}, Interest: ${interest}`);

      socket.interest = interest;
      userInterests.set(socket.id, interest);

      const count = await getMatchCount(socket.sessionId);
      if (count >= DAILY_LIMIT) {
        socket.emit("limit_reached", {
          message: "Daily match limit reached",
          limit: DAILY_LIMIT,
          used: count
        });
        return;
      }

      await addToQueue(socket.id, interest);
      await tryMatch(interest);

      if (interest !== "global") {
        setTimeout(async () => {
          if (socket.connected && !userPairs.has(socket.id)) {
            await tryMatch("global");
          }
        }, 3000);
      }

    } catch (error) {
      console.error("❌ Find match error:", error);
    }
  });

  /* ---------- SKIP ---------- */
  socket.on("skip", async () => {
    try {
      if (!socket.connected) return;

      if (userPairs.has(socket.id)) {
        await endMatch(socket.id, "skipped");
      }

      await removeFromQueue(socket.id);

      const currentCount = await getMatchCount(socket.sessionId);
      if (currentCount >= DAILY_LIMIT) {
        socket.emit("limit_reached", { message: "Daily match limit reached" });
        return;
      }

      const interest = userInterests.get(socket.id) || "global";
      await addToQueue(socket.id, interest);
      await tryMatch(interest);

    } catch (error) {
      console.error("❌ Skip Error:", error);
    }
  });

  /* ---------- CHAT ---------- */
  socket.on("send_message", (msg) => {
    if (!msg || !socket.connected) return;

    // Update stats
    messagesSent++;
    io.emit("messages_sent", messagesSent);
    io.emit("stats_update", {
      activeUsers,
      totalMatches,
      messagesSent,
      avgResponseTime: "1.2s"
    });

    const partnerId = userPairs.get(socket.id);
    if (partnerId) {
      io.to(partnerId).emit("receive_message", {
        ...msg,
        sender: socket.id,
        timestamp: Date.now()
      });
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
    const room = userRooms.get(socket.id);
    if (room === matchId) {
      socket.to(matchId).emit("offer", { offer, from: socket.id });
    }
  });

  socket.on("answer", ({ matchId, answer }) => {
    const room = userRooms.get(socket.id);
    if (room === matchId) {
      socket.to(matchId).emit("answer", { answer, from: socket.id });
    }
  });

  socket.on("ice-candidate", ({ matchId, candidate }) => {
    const room = userRooms.get(socket.id);
    if (room === matchId) {
      socket.to(matchId).emit("ice-candidate", { candidate, from: socket.id });
    }
  });

  /* ---------- CALL ENDED ---------- */
  socket.on("call-ended", async ({ matchId, reason }) => {
    const room = userRooms.get(socket.id);
    if (room === matchId) {
      await endMatch(socket.id, reason || "ended");
    }
  });

  /* ---------- REQUEST STATS ---------- */
  socket.on("request_stats", () => {
    socket.emit("stats_update", {
      activeUsers,
      totalMatches,
      messagesSent,
      avgResponseTime: "1.2s"
    });
  });

  /* ---------- DISCONNECT ---------- */
  socket.on("disconnect", async (reason) => {
    console.log(`🔴 DISCONNECT: ${socket.id}, Reason: ${reason}`);

    if (userPairs.has(socket.id)) {
      await endMatch(socket.id, "disconnect");
    }

    await removeFromQueue(socket.id);

    onlineUsers.delete(socket.id);
    userInterests.delete(socket.id);
    userSessionMap.delete(socket.sessionId);
    activeUsers--;

    setTimeout(() => {
      io.emit("online_count", onlineUsers.size);
      io.emit("active_users", activeUsers);
      io.emit("stats_update", {
        activeUsers,
        totalMatches,
        messagesSent,
        avgResponseTime: "1.2s"
      });
      console.log(`👥 Online users: ${onlineUsers.size}`);
    }, 100);
  });

  socket.on("error", (error) => {
    console.error(`⚠️ Socket error for ${socket.id}:`, error);
  });
});

/* =======================
   GRACEFUL SHUTDOWN
======================= */

const gracefulShutdown = async () => {
  console.log("\n🛑 Shutting down gracefully...");
  io.emit("server_shutdown", { message: "Server is restarting" });
  await new Promise(resolve => setTimeout(resolve, 1000));
  await redis.quit();
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Rejection:", err);
});

/* =======================
   START SERVER
======================= */

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 CORS enabled for: http://localhost:5173, https://matchmatee.netlify.app`);
});