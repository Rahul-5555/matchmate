const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// 🔥 store ONLY socket IDs
let waitingQueue = [];   // [socketId]
let userPairs = {};      // socketId -> socketId
let onlineUsers = 0;     // ✅ REAL ONLINE COUNT

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

  if (a === b) {
    waitingQueue.push(a);
    return;
  }

  userPairs[a] = b;
  userPairs[b] = a;

  io.to(a).emit("match_found");
  io.to(b).emit("match_found");
}

io.on("connection", (socket) => {
  // 🟢 user online
  onlineUsers++;
  io.emit("online_count", onlineUsers);

  // 🔍 find match
  socket.on("find_match", () => {
    if (waitingQueue.includes(socket.id)) return;

    waitingQueue.push(socket.id);
    tryMatch();
  });

  // ✉️ message
  socket.on("send_message", (message) => {
    const partnerId = userPairs[socket.id];
    if (!partnerId) return;

    io.to(partnerId).emit("receive_message", {
      text: message,
    });
  });

  // ✍️ TYPING INDICATOR (NEW)
  socket.on("typing", () => {
    const partnerId = userPairs[socket.id];
    if (partnerId) {
      io.to(partnerId).emit("partner_typing");
    }
  });

  socket.on("stop_typing", () => {
    const partnerId = userPairs[socket.id];
    if (partnerId) {
      io.to(partnerId).emit("partner_stop_typing");
    }
  });

  // ⏭ skip
  socket.on("skip", () => {
    cleanPair(socket.id);

    waitingQueue = waitingQueue.filter(id => id !== socket.id);
    waitingQueue.push(socket.id);

    tryMatch();
  });

  // ❌ disconnect
  socket.on("disconnect", () => {
    cleanPair(socket.id);
    waitingQueue = waitingQueue.filter(id => id !== socket.id);

    onlineUsers--;
    io.emit("online_count", onlineUsers);
  });
});

server.listen(5000, () => {
  console.log("🚀 Server running on http://localhost:5000");
});
