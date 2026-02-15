const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();

/* =======================
   CONFIG
======================= */

const DAILY_LIMIT = 3;

// sessionId -> count
const userMatchCount = new Map();

/* =======================
   HTTP CORS
======================= */

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

/* =======================
   SOCKET.IO
======================= */

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
   STATE
======================= */

const onlineUsers = new Set();
let waitingQueue = [];

const userPairs = new Map();   // socketId -> partnerId
const userRooms = new Map();   // socketId -> matchId
const matchTimers = new Map(); // matchId -> timeout

/* =======================
   HELPERS
======================= */

function removeFromQueue(socketId) {
  waitingQueue = waitingQueue.filter(id => id !== socketId);
}

function clearMatchTimer(matchId) {
  if (matchTimers.has(matchId)) {
    clearTimeout(matchTimers.get(matchId));
    matchTimers.delete(matchId);
  }
}

function incrementMatchCount(sessionId) {
  const current = userMatchCount.get(sessionId) || 0;
  userMatchCount.set(sessionId, current + 1);
}

function endMatch(socketId, reason = "ended") {
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
}

/* =======================
   MATCH USERS
======================= */

function tryMatch() {
  waitingQueue = waitingQueue.filter(
    id => io.sockets.sockets.has(id) && !userRooms.has(id)
  );

  if (waitingQueue.length < 2) return;

  const user1 = waitingQueue.shift();
  const user2 = waitingQueue.shift();

  if (!user1 || !user2 || user1 === user2) return;

  const matchId =
    "match_" + Date.now() + "_" + Math.random().toString(36).slice(2);

  userPairs.set(user1, user2);
  userPairs.set(user2, user1);

  userRooms.set(user1, matchId);
  userRooms.set(user2, matchId);

  io.sockets.sockets.get(user1)?.join(matchId);
  io.sockets.sockets.get(user2)?.join(matchId);

  io.to(user1).emit("match_found", { matchId, role: "caller" });
  io.to(user2).emit("match_found", { matchId, role: "callee" });

  // 🔥 Increment usage based on sessionId
  const s1 = io.sockets.sockets.get(user1);
  const s2 = io.sockets.sockets.get(user2);

  if (s1?.sessionId) incrementMatchCount(s1.sessionId);
  if (s2?.sessionId) incrementMatchCount(s2.sessionId);

  // 🔥 10 min timer
  const timer = setTimeout(() => {
    endMatch(user1, "timeout");
  }, 10 * 60 * 1000);

  matchTimers.set(matchId, timer);
}

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

  console.log("🟢 CONNECT:", socket.id, "| Session:", sessionId);

  onlineUsers.add(socket.id);
  io.emit("online_count", onlineUsers.size);

  /* ---------- FIND MATCH ---------- */

  socket.on("find_match", () => {

    const currentCount = userMatchCount.get(socket.sessionId) || 0;

    if (currentCount >= DAILY_LIMIT) {
      socket.emit("limit_reached");
      return;
    }

    if (!waitingQueue.includes(socket.id) && !userRooms.has(socket.id)) {
      waitingQueue.push(socket.id);
      tryMatch();
    }
  });

  /* ---------- SKIP ---------- */

  socket.on("skip", () => {

    endMatch(socket.id, "skipped");
    removeFromQueue(socket.id);

    const currentCount = userMatchCount.get(socket.sessionId) || 0;

    if (currentCount >= DAILY_LIMIT) {
      socket.emit("limit_reached");
      return;
    }

    waitingQueue.push(socket.id);
    tryMatch();
  });

  /* ---------- CHAT ---------- */

  socket.on("send_message", (msg) => {
    const partnerId = userPairs.get(socket.id);
    if (!partnerId) return;
    io.to(partnerId).emit("receive_message", msg);
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

  /* ---------- MANUAL END CALL ---------- */

  socket.on("call-ended", ({ matchId, reason }) => {
    if (userRooms.get(socket.id) !== matchId) return;

    endMatch(socket.id, reason || "ended");
  });


  /* ---------- DISCONNECT ---------- */

  socket.on("disconnect", () => {

    console.log("🔴 DISCONNECT:", socket.id);

    endMatch(socket.id, "disconnect");
    removeFromQueue(socket.id);

    onlineUsers.delete(socket.id);
    io.emit("online_count", onlineUsers.size);
  });
});

/* =======================
   START SERVER
======================= */

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});
