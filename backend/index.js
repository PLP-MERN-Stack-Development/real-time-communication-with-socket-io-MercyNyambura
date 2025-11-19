const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const multer = require("multer");

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: "10mb" }));

// For demo file uploads (not required — we accept base64 too)
const upload = multer({ storage: multer.memoryStorage() });

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: true },
});

const PORT = process.env.PORT || 5000;

/**
 * In-memory stores for demo only.
 * Replace with a DB (MongoDB) in production.
 */
const users = {};        // socketId -> { username, userId, room }
const userByName = {};   // username -> { socketId, userId }
const rooms = { general: [] }; // roomName -> [messageObjects]
const unreadCounts = {}; // userId -> count

// Message structure:
// { id, from, fromId, to, toId (optional), room, text, type: 'text'|'file', fileName, timestamp, read: [] }

const generateId = () => Math.random().toString(36).slice(2, 9);

app.get("/health", (req, res) => res.json({ status: "ok" }));

// Paginate messages for a room
app.get("/rooms/:room/messages", (req, res) => {
  const { room } = req.params;
  const before = req.query.before || Date.now();
  const limit = Number(req.query.limit) || 30;
  const list = (rooms[room] || [])
    .filter(m => m.timestamp < Number(before))
    .sort((a,b)=>b.timestamp-a.timestamp)
    .slice(0, limit);
  res.json(list.reverse());
});

io.on("connection", (socket) => {
  console.log("socket connected:", socket.id);

  // Basic join: client sends { username, room }
  socket.on("join", ({ username, room = "general", userId }, ack) => {
    userId = userId || generateId();
    users[socket.id] = { username, userId, room };
    userByName[username] = { socketId: socket.id, userId };
    socket.join(room);

    // ensure room exists
    if (!rooms[room]) rooms[room] = [];

    // notify room and update online list
    io.to(room).emit("notification", { type: "join", username, userId, room });
    io.emit("online-users", Object.values(users).map(u => ({ username: u.username, userId: u.userId })));

    // ack with user info
    ack && ack({ ok: true, userId });
  });

  socket.on("send-message", (msg, ack) => {
    // msg: { text, room, to (username optional), type, fileName, fileData (base64) }
    const sender = users[socket.id];
    if (!sender) return ack && ack({ ok: false, error: "not authenticated" });

    const message = {
      id: generateId(),
      from: sender.username,
      fromId: sender.userId,
      to: msg.to || null,
      toId: msg.to ? (userByName[msg.to] && userByName[msg.to].userId) : null,
      room: msg.room || sender.room || "general",
      text: msg.text || null,
      type: msg.type || "text",
      fileName: msg.fileName || null,
      fileData: msg.fileData || null, // base64 string (watch size)
      timestamp: Date.now(),
      read: [], // userIds who have read
      reactions: {}
    };

    // Save (room or private)
    if (message.to) {
      // Private: emit to sender and recipient only
      const target = userByName[message.to];
      if (target) {
        rooms[message.room] = rooms[message.room] || [];
        rooms[message.room].push(message);
        io.to(target.socketId).emit("private-message", message);
        socket.emit("private-message", message);
      } else {
        // user offline: still store and increment unread
        unreadCounts[userByName[message.to]?.userId || message.to] = (unreadCounts[message.to] || 0) + 1;
        socket.emit("private-message", message);
      }
    } else {
      // Global room message
      rooms[message.room] = rooms[message.room] || [];
      rooms[message.room].push(message);
      io.to(message.room).emit("room-message", message);
    }

    // Delivery ack
    ack && ack({ ok: true, id: message.id, timestamp: message.timestamp });
  });

  // Typing indicator
  socket.on("typing", ({ room, isTyping }) => {
    const u = users[socket.id];
    if (!u) return;
    socket.to(room || u.room).emit("user-typing", { username: u.username, isTyping });
  });

  // Mark message as read
  socket.on("message-read", ({ messageId }) => {
    const u = users[socket.id];
    if (!u) return;
    // find message in any room
    Object.values(rooms).forEach(list => {
      const m = list.find(x => x.id === messageId);
      if (m && !m.read.includes(u.userId)) {
        m.read.push(u.userId);
        // notify sender about read-receipt
        // find sender socket
        const senderInfo = userByName[m.from];
        if (senderInfo) {
          io.to(senderInfo.socketId).emit("read-receipt", { messageId, reader: u.username });
        }
      }
    });
  });

  // Reactions
  socket.on("react", ({ messageId, reaction }) => {
    const u = users[socket.id];
    if (!u) return;
    let found = null;
    Object.values(rooms).forEach(list => {
      const m = list.find(x => x.id === messageId);
      if (m) found = m;
    });
    if (found) {
      found.reactions[reaction] = found.reactions[reaction] || [];
      if (!found.reactions[reaction].includes(u.userId)) {
        found.reactions[reaction].push(u.userId);
      }
      // broadcast updated reactions
      io.to(found.room).emit("reaction-updated", { messageId, reactions: found.reactions });
    }
  });

  socket.on("disconnect", () => {
    const u = users[socket.id];
    if (u) {
      delete userByName[u.username];
      delete users[socket.id];
      io.emit("online-users", Object.values(users).map(x => ({ username: x.username, userId: x.userId })));
      io.to(u.room).emit("notification", { type: "leave", username: u.username });
    }
    console.log("socket disconnected:", socket.id);
  });
});

server.listen(PORT, () => console.log(`Server listening on ${PORT}`));
