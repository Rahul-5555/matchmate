const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();

/* ✅ HTTP CORS */
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        "http://localhost:5173",
        "https://matchmatee.netlify.app",
      ];

      allowedOrigins.includes(origin)
        ? callback(null, true)
        : callback(new Error("CORS not allowed"));
    },
    credentials: true,
  })
);

const server = http.createServer(app);

/* ✅ SOCKET.IO */
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://matchmatee.netlify.app",
    ],
    credentials: true,
  },
  transports: ["polling", "websocket"],
});

/* 🔥 STATE */
const onlineUsers = new Set();
let waitingQueue = [];
const userPairs = {};
const userRooms = {};
const matchTimers = {};

/* 🧹 END MATCH (SINGLE SOURCE OF TRUTH) */
function endMatch(socketId, reason = "ended") {
  const partnerId = userPairs[socketId];
  const matchId = userRooms[socketId];

  if (!partnerId || !matchId) return;

  // clear timer
  if (matchTimers[matchId]) {
    clearTimeout(matchTimers[matchId]);
    delete matchTimers[matchId];
  }

  // notify both
  io.to(matchId).emit("call-ended", { reason });

  // leave room
  io.sockets.sockets.get(socketId)?.leave(matchId);
  io.sockets.sockets.get(partnerId)?.leave(matchId);

  // cleanup
  delete userPairs[socketId];
  delete userPairs[partnerId];
  delete userRooms[socketId];
  delete userRooms[partnerId];
}

/* 🔁 MATCH USERS */
function tryMatch() {
  waitingQueue = waitingQueue.filter((id) =>
    io.sockets.sockets.has(id)
  );

  if (waitingQueue.length < 2) return;

  const a = waitingQueue.shift();
  const b = waitingQueue.shift();
  if (!a || !b || a === b) return;

  const matchId = `match_${a}_${b}`;

  userPairs[a] = b;
  userPairs[b] = a;
  userRooms[a] = matchId;
  userRooms[b] = matchId;

  io.sockets.sockets.get(a)?.join(matchId);
  io.sockets.sockets.get(b)?.join(matchId);

  // 🔥 server decides roles
  io.to(a).emit("match_found", { matchId, role: "caller" });
  io.to(b).emit("match_found", { matchId, role: "callee" });

  const timer = setTimeout(() => {
    io.to(matchId).emit("match_timeout");
    endMatch(a, "timeout");
  }, 10 * 60 * 1000);

  matchTimers[matchId] = timer;
}

/* 🔌 SOCKET */
io.on("connection", (socket) => {
  console.log("🟢 CONNECT:", socket.id);

  onlineUsers.add(socket.id);
  io.emit("online_count", onlineUsers.size);

  socket.on("find_match", () => {
    if (!waitingQueue.includes(socket.id)) {
      waitingQueue.push(socket.id);
      tryMatch();
    }
  });

  socket.on("skip", () => {
    endMatch(socket.id, "skipped");
    waitingQueue = waitingQueue.filter((id) => id !== socket.id);
    waitingQueue.push(socket.id);
    tryMatch();
  });

  /* 💬 CHAT */
  socket.on("send_message", (text) => {
    const partnerId = userPairs[socket.id];
    if (partnerId) io.to(partnerId).emit("receive_message", { text });
  });

  /* 🎧 WEBRTC SIGNALING (MATCH SAFE) */
  socket.on("offer", ({ matchId, offer }) => {
    if (userRooms[socket.id] === matchId) {
      socket.to(matchId).emit("offer", { offer });
    }
  });

  socket.on("answer", ({ matchId, answer }) => {
    if (userRooms[socket.id] === matchId) {
      socket.to(matchId).emit("answer", { answer });
    }
  });

  socket.on("ice-candidate", ({ matchId, candidate }) => {
    if (userRooms[socket.id] === matchId) {
      socket.to(matchId).emit("ice-candidate", { candidate });
    }
  });

  /* 🔇 MUTE */
  socket.on("mute", () => {
    const partnerId = userPairs[socket.id];
    if (partnerId) io.to(partnerId).emit("partner_muted");
  });

  socket.on("unmute", () => {
    const partnerId = userPairs[socket.id];
    if (partnerId) io.to(partnerId).emit("partner_unmuted");
  });

  /* ❌ DISCONNECT */
  socket.on("disconnect", () => {
    console.log("🔴 DISCONNECT:", socket.id);

    endMatch(socket.id, "disconnect");
    waitingQueue = waitingQueue.filter((id) => id !== socket.id);

    onlineUsers.delete(socket.id);
    io.emit("online_count", onlineUsers.size);
  });
});

/* 🚀 START */
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});
