const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();

/* ✅ HTTP CORS (API safety) */
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://matchmate-8yop.onrender.com"
  ],
  credentials: true
}));

const server = http.createServer(app);

/* ✅ SOCKET.IO CONFIG (MOST IMPORTANT FIX) */
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://matchmate-8yop.onrender.com"
    ],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ["websocket"] // 🔥 FORCE websocket (mobile fix)
});

/* 🔥 RELIABLE ONLINE USER TRACKING */
let onlineUsers = new Set(); // instead of number

let waitingQueue = [];   // socketId[]
let userPairs = {};      // socketId -> socketId

// 🧹 clean pair helper
function cleanPair(socketId) {
  const partnerId = userPairs[socketId];

  if (partnerId) {
    io.to(partnerId).emit("partner_left");
    delete userPairs[partnerId];
    delete userPairs[socketId];
  }
}

// 🔁 try matchmaking
function tryMatch() {
  if (waitingQueue.length < 2) return;

  const a = waitingQueue.shift();
  const b = waitingQueue.shift();

  if (!a || !b || a === b) return;

  userPairs[a] = b;
  userPairs[b] = a;

  io.to(a).emit("match_found");
  io.to(b).emit("match_found");
}

io.on("connection", (socket) => {
  /* 🟢 USER CONNECTED */
  onlineUsers.add(socket.id);
  io.emit("online_count", onlineUsers.size);

  /* 🔍 FIND MATCH */
  socket.on("find_match", () => {
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
    waitingQueue = waitingQueue.filter(id => id !== socket.id);
    waitingQueue.push(socket.id);
    tryMatch();
  });

  /* ❌ DISCONNECT */
  socket.on("disconnect", () => {
    cleanPair(socket.id);
    waitingQueue = waitingQueue.filter(id => id !== socket.id);

    onlineUsers.delete(socket.id);
    io.emit("online_count", onlineUsers.size);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});
