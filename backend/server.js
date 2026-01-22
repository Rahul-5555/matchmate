const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();

/* ✅ HTTP CORS (SAFE FOR DEV) */
// app.use(
//   cors({
//     origin: true,
//     origin: allowedOrigins,
//     credentials: true,
//   })
// );

// const server = http.createServer(app);

// /* ✅ SOCKET.IO CONFIG (DO NOT FORCE WEBSOCKET) */
// const io = new Server(server, {
//   cors: {
//     origin: true,
//     origin: allowedOrigins,
//     credentials: true,
//   },
//   transports: ["polling", "websocket"],
//   allowUpgrades: true,
// });

/* ✅ HTTP CORS (PROD SAFE) */
app.use(
  cors({
    origin: (origin, callback) => {
      // allow REST tools & server-to-server
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        "http://localhost:5173",
        "https://matchmatee.netlify.app",
      ];

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS not allowed"));
      }
    },
    credentials: true,
  })
);

const server = http.createServer(app);

/* ✅ SOCKET.IO CORS (IMPORTANT) */
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
let onlineUsers = new Set();
let waitingQueue = [];          // socketId[]
let userPairs = {};             // socketId -> socketId
let userRooms = {};             // socketId -> matchId
let matchTimers = {};           // matchId -> timeoutId

/* 🧹 CLEAN PAIR HELPER */
function cleanPair(socketId) {
  const partnerId = userPairs[socketId];
  if (!partnerId) return;

  const matchId = userRooms[socketId];

  // ⏱️ clear timer if exists
  if (matchId && matchTimers[matchId]) {
    clearTimeout(matchTimers[matchId]);
    delete matchTimers[matchId];
  }

  io.to(partnerId).emit("partner_left");

  delete userPairs[partnerId];
  delete userPairs[socketId];
  delete userRooms[partnerId];
  delete userRooms[socketId];
}

/* 🔁 TRY MATCH (SAFE VERSION) */
function tryMatch() {
  // 🧹 remove dead sockets
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

  console.log("🎯 MATCH CREATED:", matchId);

  io.to(a).emit("match_found", { matchId });
  io.to(b).emit("match_found", { matchId });

  /* ⏱️ AUTO END AFTER 10 MIN */
  const timer = setTimeout(() => {
    console.log("⏱️ MATCH TIMEOUT:", matchId);

    io.to(matchId).emit("match_timeout");

    cleanPair(a);
    cleanPair(b);

    delete matchTimers[matchId];
  }, 10 * 60 * 1000); // 10 minutes

  matchTimers[matchId] = timer;
}

/* 🔌 SOCKET CONNECTION */
io.on("connection", (socket) => {
  console.log("🟢 CONNECT:", socket.id);

  onlineUsers.add(socket.id);
  io.emit("online_count", onlineUsers.size);
  socket.emit("online_count", onlineUsers.size);

  /* 🔍 FIND MATCH */
  socket.on("find_match", () => {
    console.log("🔍 find_match:", socket.id);

    if (!waitingQueue.includes(socket.id)) {
      waitingQueue.push(socket.id);
      tryMatch();
    }
  });

  /* ✉️ SEND MESSAGE */
  socket.on("send_message", (message) => {
    const partnerId = userPairs[socket.id];
    if (partnerId) {
      io.to(partnerId).emit("receive_message", { text: message });
    }
  });

  /* ✍️ TYPING */
  socket.on("typing", () => {
    const partnerId = userPairs[socket.id];
    if (partnerId) io.to(partnerId).emit("partner_typing");
  });

  socket.on("stop_typing", () => {
    const partnerId = userPairs[socket.id];
    if (partnerId) io.to(partnerId).emit("partner_stop_typing");
  });

  /* ⏭ SKIP */
  socket.on("skip", () => {
    cleanPair(socket.id);
    waitingQueue = waitingQueue.filter((id) => id !== socket.id);
    waitingQueue.push(socket.id);
    tryMatch();
  });

  /* 🔊 JOIN / LEAVE ROOM (OPTIONAL SAFETY) */
  socket.on("join-room", (matchId) => {
    socket.join(matchId);
  });

  socket.on("leave-room", (matchId) => {
    socket.leave(matchId);
  });

  /* 🎧 WEBRTC SIGNALING */
  socket.on("offer", ({ matchId, offer }) => {
    socket.to(matchId).emit("offer", { offer });
  });

  socket.on("answer", ({ matchId, answer }) => {
    socket.to(matchId).emit("answer", { answer });
  });

  socket.on("ice-candidate", ({ matchId, candidate }) => {
    socket.to(matchId).emit("ice-candidate", { candidate });
  });

  /* 🔇 MUTE STATUS */
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

    cleanPair(socket.id);
    waitingQueue = waitingQueue.filter((id) => id !== socket.id);

    onlineUsers.delete(socket.id);
    io.emit("online_count", onlineUsers.size);
  });
});

/* 🚀 START SERVER */
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});
