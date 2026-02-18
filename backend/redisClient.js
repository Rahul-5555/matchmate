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
const MATCH_TIMEOUT = 10 * 60 * 1000; // 10 minutes
const PORT = process.env.PORT || 5000;

/* =======================
   REDIS WITH RECONNECTION
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
    credentials: true
  })
);

app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://matchmatee.netlify.app",
    ],
    credentials: true
  },
  transports: ["websocket", "polling"], // polling as fallback
});

/* =======================
   MEMORY STATE
======================= */

const onlineUsers = new Map(); // socketId -> { sessionId, interest }
const userPairs = new Map(); // socketId -> partnerId
const userRooms = new Map(); // socketId -> roomName
const matchTimers = new Map(); // matchId -> timer

/* =======================
   REDIS HELPERS
======================= */

const queueKey = (interest) => `match:queue:${interest || "global"}`;

const addToQueue = async (socketId, interest) => {
  await redis.lPush(queueKey(interest), socketId);
  console.log(`📥 Added to queue ${interest}: ${socketId}`);
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
   MATCH CREATION
======================= */

const createMatch = async (user1Id, user2Id, interest) => {
  try {
    const matchId = `match_${crypto.randomUUID()}`;
    const roomName = `room_${matchId}`;

    console.log(`🎯 Creating match: ${user1Id} <-> ${user2Id}`);

    // Store in memory
    userPairs.set(user1Id, user2Id);
    userPairs.set(user2Id, user1Id);
    userRooms.set(user1Id, roomName);
    userRooms.set(user2Id, roomName);

    // Get socket instances
    const socket1 = io.sockets.sockets.get(user1Id);
    const socket2 = io.sockets.sockets.get(user2Id);

    if (!socket1 || !socket2) {
      console.log("⚠️ Socket not found for match");
      return false;
    }

    // Join socket room
    await socket1.join(roomName);
    await socket2.join(roomName);

    // Emit match found events
    socket1.emit("match_found", {
      matchId,
      role: "caller",
      partnerId: user2Id
    });

    socket2.emit("match_found", {
      matchId,
      role: "callee",
      partnerId: user1Id
    });

    // Store in Redis for persistence
    await redis.hSet(`match:${matchId}`, {
      user1: user1Id,
      user2: user2Id,
      user1Session: socket1.sessionId,
      user2Session: socket2.sessionId,
      interest: interest || "global",
      startedAt: Date.now().toString()
    });
    await redis.expire(`match:${matchId}`, 3600); // 1 hour

    // Set match timer (10 minutes)
    const timer = setTimeout(() => {
      endMatch(user1Id, "timeout");
    }, MATCH_TIMEOUT);

    matchTimers.set(matchId, timer);

    // Update stats
    await redis.incr("stats:total_matches");

    // Store recent match to prevent repeat
    await storeRecentMatch(socket1.sessionId, socket2.sessionId);

    // Increment daily counts
    await incrementMatchCount(socket1.sessionId);
    await incrementMatchCount(socket2.sessionId);

    console.log(`✅ Match created successfully: ${matchId}`);
    return true;

  } catch (err) {
    console.error("❌ Error creating match:", err);
    return false;
  }
};

/* =======================
   SMART MATCHING
======================= */

const tryMatch = async (interest) => {
  try {
    const key = queueKey(interest);
    let queueLength = await redis.lLen(key);

    console.log(`📊 Queue ${interest}: ${queueLength} users`);

    if (queueLength < 2) {
      return;
    }

    // Get all users from queue
    const users = await redis.lRange(key, 0, -1);

    // Filter valid users (still connected)
    const validUsers = [];
    for (const userId of users) {
      const socket = io.sockets.sockets.get(userId);
      if (socket && !userPairs.has(userId)) { // Not already in a chat
        validUsers.push(userId);
      } else {
        // Remove invalid user from queue
        await redis.lRem(key, 1, userId);
      }
    }

    if (validUsers.length < 2) return;

    // Shuffle for fairness
    for (let i = validUsers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [validUsers[i], validUsers[j]] = [validUsers[j], validUsers[i]];
    }

    let matched = false;

    // Try to find compatible match
    for (let i = 0; i < validUsers.length - 1 && !matched; i++) {
      for (let j = i + 1; j < validUsers.length && !matched; j++) {
        const user1 = validUsers[i];
        const user2 = validUsers[j];

        const socket1 = io.sockets.sockets.get(user1);
        const socket2 = io.sockets.sockets.get(user2);

        if (!socket1 || !socket2) continue;

        // Check if recently matched
        const blocked = await isRecentlyMatched(
          socket1.sessionId,
          socket2.sessionId
        );

        if (!blocked) {
          console.log(`✅ Match found: ${user1} <-> ${user2}`);

          // Remove matched users from queue
          await redis.lRem(key, 1, user1);
          await redis.lRem(key, 1, user2);

          // Create the match
          const success = await createMatch(user1, user2, interest);

          if (success) {
            matched = true;
          } else {
            // If match creation failed, put back in queue
            await redis.lPush(key, user1);
            await redis.lPush(key, user2);
          }
        }
      }
    }

    if (!matched) {
      console.log(`🔄 No compatible match found for ${interest}`);
    }

  } catch (err) {
    console.error("❌ Match Error:", err);
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
    console.log(`🔚 Ending match for ${socketId}, reason: ${reason}`);

    const partnerId = userPairs.get(socketId);
    const roomName = userRooms.get(socketId);

    if (!roomName) return;

    // Get matchId from roomName
    const matchId = roomName.replace('room_', '');
    clearMatchTimer(matchId);

    // Notify both users
    io.to(roomName).emit("call_ended", {
      reason,
      message: reason === "timeout" ? "Call time limit reached" : "Partner disconnected"
    });

    // Leave rooms after small delay
    setTimeout(() => {
      const socket1 = io.sockets.sockets.get(socketId);
      const socket2 = io.sockets.sockets.get(partnerId);

      if (socket1) socket1.leave(roomName);
      if (socket2) socket2.leave(roomName);
    }, 100);

    // Clean up memory
    userPairs.delete(socketId);
    userPairs.delete(partnerId);
    userRooms.delete(socketId);
    userRooms.delete(partnerId);

    // Remove from Redis queues
    await removeFromAllQueues(socketId);
    if (partnerId) await removeFromAllQueues(partnerId);

    // Update Redis match status
    if (matchId) {
      await redis.hSet(`match:${matchId}`, "endedAt", Date.now().toString());
      await redis.hSet(`match:${matchId}`, "endReason", reason);
    }

    console.log(`✅ Match ended cleanly: ${socketId} & ${partnerId}`);

  } catch (err) {
    console.error("❌ Error ending match:", err);
  }
};

/* =======================
   HEALTH CHECK ENDPOINTS
======================= */

app.get("/", (req, res) => {
  res.json({
    name: "MatchMate API",
    status: "running",
    version: "1.0.0"
  });
});

app.get("/health", async (req, res) => {
  try {
    // Check Redis
    await redis.ping();

    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      stats: {
        onlineUsers: onlineUsers.size,
        activePairs: userPairs.size / 2,
        activeRooms: userRooms.size / 2,
        redis: "connected"
      }
    });
  } catch (err) {
    res.status(500).json({
      status: "unhealthy",
      error: err.message,
      redis: "disconnected"
    });
  }
});

app.get("/stats", async (req, res) => {
  try {
    const totalMatches = await redis.get("stats:total_matches") || 0;
    const queueLengths = {};

    const keys = await redis.keys("match:queue:*");
    for (const key of keys) {
      const length = await redis.lLen(key);
      queueLengths[key.replace("match:queue:", "")] = length;
    }

    res.json({
      onlineUsers: onlineUsers.size,
      totalMatches: parseInt(totalMatches),
      queues: queueLengths,
      activeChats: userPairs.size / 2,
      activeRooms: userRooms.size / 2
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =======================
   SOCKET.IO HANDLERS
======================= */

io.on("connection", (socket) => {
  // Handle session
  const sessionId = socket.handshake.auth?.sessionId ||
    socket.handshake.headers?.['x-session-id'] ||
    crypto.randomUUID();

  socket.sessionId = sessionId;

  // Store user info
  onlineUsers.set(socket.id, {
    sessionId,
    connectedAt: Date.now()
  });

  console.log(`✅ Socket connected: ${socket.id}, Session: ${sessionId}`);
  console.log(`👥 Online users: ${onlineUsers.size}`);

  // Send online count to all
  io.emit("online_count", onlineUsers.size);

  // Send session ID back to client
  socket.emit("session_ready", { sessionId });

  // Handle find match request
  socket.on("find_match", async ({ interest }) => {
    try {
      // Check daily limit
      const count = await getMatchCount(socket.sessionId);
      const remaining = DAILY_LIMIT - count;

      console.log(`📊 User ${socket.sessionId} - Today: ${count}/${DAILY_LIMIT} matches`);

      if (count >= DAILY_LIMIT) {
        socket.emit("limit_reached", {
          message: "Daily match limit reached",
          limit: DAILY_LIMIT,
          used: count,
          nextReset: "Tomorrow at 12:00 AM"
        });
        return;
      }

      // Send limit status
      socket.emit("limit_status", {
        used: count,
        remaining: remaining,
        limit: DAILY_LIMIT
      });

      // Store interest
      socket.interest = interest || "global";

      // Update online user info
      onlineUsers.set(socket.id, {
        ...onlineUsers.get(socket.id),
        interest: socket.interest
      });

      // Add to queue
      await addToQueue(socket.id, socket.interest);

      // Try to match in this interest
      await tryMatch(socket.interest);

      // Also check global queue after delay if not matched
      if (socket.interest !== "global") {
        setTimeout(async () => {
          // Check if still not in a chat
          if (!userPairs.has(socket.id)) {
            await tryMatch("global");
          }
        }, 3000);
      }

    } catch (err) {
      console.error("❌ Find match error:", err);
      socket.emit("error", { message: "Failed to find match" });
    }
  });

  // Handle skip/next
  socket.on("skip", async () => {
    console.log(`⏭️ User ${socket.id} skipped`);

    // End current match if any
    if (userPairs.has(socket.id)) {
      await endMatch(socket.id, "skipped");
    }

    // Remove from all queues
    await removeFromAllQueues(socket.id);

    // Add back to queue with same interest
    if (socket.interest) {
      await addToQueue(socket.id, socket.interest);
      await tryMatch(socket.interest);
    }
  });

  // Handle WebRTC signaling
  socket.on("offer", (data) => {
    const { target, offer } = data;
    console.log(`📞 Offer from ${socket.id} to ${target}`);
    io.to(target).emit("offer", { offer, from: socket.id });
  });

  socket.on("answer", (data) => {
    const { target, answer } = data;
    console.log(`📞 Answer from ${socket.id} to ${target}`);
    io.to(target).emit("answer", { answer, from: socket.id });
  });

  socket.on("ice-candidate", (data) => {
    const { target, candidate } = data;
    io.to(target).emit("ice-candidate", { candidate, from: socket.id });
  });

  // Handle chat messages
  socket.on("send_message", (data) => {
    const room = userRooms.get(socket.id);
    if (room) {
      socket.to(room).emit("receive_message", {
        message: data.message,
        sender: socket.id,
        timestamp: Date.now()
      });
    }
  });

  socket.on("typing", () => {
    const room = userRooms.get(socket.id);
    if (room) {
      socket.to(room).emit("partner_typing");
    }
  });

  socket.on("stop_typing", () => {
    const room = userRooms.get(socket.id);
    if (room) {
      socket.to(room).emit("partner_stop_typing");
    }
  });

  // Handle disconnect
  socket.on("disconnect", async () => {
    console.log(`❌ Socket disconnected: ${socket.id}`);

    // End any active match
    if (userPairs.has(socket.id)) {
      await endMatch(socket.id, "disconnect");
    }

    // Remove from queues
    await removeFromAllQueues(socket.id);

    // Remove from online users
    onlineUsers.delete(socket.id);

    // Update online count
    io.emit("online_count", onlineUsers.size);
    console.log(`👥 Online users: ${onlineUsers.size}`);
  });
});

/* =======================
   START SERVER
======================= */

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing gracefully...');
  await redis.quit();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing gracefully...');
  await redis.quit();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export { io, redis };