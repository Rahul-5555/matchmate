const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();

/* =======================
   HTTP CORS
======================= */
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

/* =======================
   SOCKET.IO
======================= */
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

/* =======================
   STATE
======================= */
const onlineUsers = new Set();
let waitingQueue = [];

const userPairs = {};     // socketId -> partnerId
const userRooms = {};     // socketId -> matchId
const matchTimers = {};   // matchId -> timeout
const matchTimeouts = {}; // socketId -> timeout

/* =======================
   END MATCH (CHAT LEVEL)
======================= */
function endMatch(socketId, reason = "ended") {
  const matchId = userRooms[socketId];
  if (!matchId) return;

  const partnerId = userPairs[socketId];

  // ⏱️ clear match timer
  if (matchTimers[matchId]) {
    clearTimeout(matchTimers[matchId]);
    delete matchTimers[matchId];
  }

  // 🔔 CHAT / MATCH END (NOT AUDIO)
  io.to(matchId).emit("call-ended", { reason });

  // 🚪 leave rooms safely
  setTimeout(() => {
    io.sockets.sockets.get(socketId)?.leave(matchId);
    io.sockets.sockets.get(partnerId)?.leave(matchId);
  }, 100);

  delete userPairs[socketId];
  delete userPairs[partnerId];
  delete userRooms[socketId];
  delete userRooms[partnerId];
}

/* =======================
   MATCH USERS
======================= */
function tryMatch() {
  waitingQueue = waitingQueue.filter(
    (id) => io.sockets.sockets.has(id) && !userRooms[id]
  );

  if (waitingQueue.length < 2) return;

  const caller = waitingQueue.shift();
  const callee = waitingQueue.shift();
  if (!caller || !callee || caller === callee) return;

  const matchId =
    "match_" + Date.now() + "_" + Math.random().toString(36).slice(2);

  userPairs[caller] = callee;
  userPairs[callee] = caller;
  userRooms[caller] = matchId;
  userRooms[callee] = matchId;

  io.sockets.sockets.get(caller)?.join(matchId);
  io.sockets.sockets.get(callee)?.join(matchId);

  io.to(caller).emit("match_found", { matchId, role: "caller" });
  io.to(callee).emit("match_found", { matchId, role: "callee" });

  // ⏱️ AUTO END MATCH (10 min)
  matchTimers[matchId] = setTimeout(() => {
    endMatch(caller, "timeout");
  }, 10 * 60 * 1000);
}

/* =======================
   SOCKET CONNECTION
======================= */
io.on("connection", (socket) => {
  console.log("🟢 CONNECT:", socket.id);

  onlineUsers.add(socket.id);
  io.emit("online_count", onlineUsers.size);

  /* ---------- FIND MATCH ---------- */
  socket.on("find_match", () => {
    if (!waitingQueue.includes(socket.id) && !userRooms[socket.id]) {
      waitingQueue.push(socket.id);

      matchTimeouts[socket.id] = setTimeout(() => {
        if (!userRooms[socket.id]) {
          socket.emit("match_timeout");
          waitingQueue = waitingQueue.filter(
            (id) => id !== socket.id
          );
        }
        delete matchTimeouts[socket.id];
      }, 8000);

      tryMatch();
    }
  });

  /* ---------- SKIP ---------- */
  socket.on("skip", () => {
    endMatch(socket.id, "skipped");

    waitingQueue = waitingQueue.filter(
      (id) => id !== socket.id
    );
    waitingQueue.push(socket.id);

    tryMatch();
  });

  /* ---------- CHAT (UPDATED) ---------- */

  // SEND MESSAGE
  socket.on("send_message", (msg) => {
    const partnerId = userPairs[socket.id];
    if (!partnerId) return;

    // send message to partner
    io.to(partnerId).emit("receive_message", msg);

    // sender already has "sent"
  });

  // MESSAGE DELIVERED
  socket.on("message_delivered", ({ messageId }) => {
    const partnerId = userPairs[socket.id];
    if (!partnerId) return;

    io.to(partnerId).emit("message_status", {
      messageId,
      status: "delivered",
    });
  });

  // MESSAGE SEEN
  socket.on("message_seen", ({ messageId }) => {
    const partnerId = userPairs[socket.id];
    if (!partnerId) return;

    io.to(partnerId).emit("message_status", {
      messageId,
      status: "seen",
    });
  });


  socket.on("typing", () => {
    const partnerId = userPairs[socket.id];
    if (partnerId) io.to(partnerId).emit("partner_typing");
  });

  socket.on("stop_typing", () => {
    const partnerId = userPairs[socket.id];
    if (partnerId) io.to(partnerId).emit("partner_stop_typing");
  });

  /* ---------- WEBRTC SIGNALING ---------- */
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

  /* ---------- 🔊 AUDIO ONLY ---------- */
  socket.on("audio:end", ({ matchId }) => {
    if (!matchId) return;
    socket.to(matchId).emit("audio:ended");
  });

  /* ---------- 🔇 MUTE ---------- */
  socket.on("mute", () => {
    const partnerId = userPairs[socket.id];
    if (partnerId) io.to(partnerId).emit("partner_muted");
  });

  socket.on("unmute", () => {
    const partnerId = userPairs[socket.id];
    if (partnerId) io.to(partnerId).emit("partner_unmuted");
  });

  /* ---------- DISCONNECT ---------- */
  socket.on("disconnect", () => {
    console.log("🔴 DISCONNECT:", socket.id);

    endMatch(socket.id, "disconnect");

    waitingQueue = waitingQueue.filter(
      (id) => id !== socket.id
    );

    if (matchTimeouts[socket.id]) {
      clearTimeout(matchTimeouts[socket.id]);
      delete matchTimeouts[socket.id];
    }

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
