// server/index.js
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const multer = require('multer');
const { nanoid } = require('nanoid');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const users = {};
const messages = {}; // messages per room, room 'global' exists by default
const rooms = new Set(['global']); // rooms list

// Simple REST endpoints for pagination / rooms
app.get('/api/rooms', (req, res) => {
  res.json(Array.from(rooms));
});

// pagination: /api/messages?room=global&page=1&limit=20
app.get('/api/messages', (req, res) => {
  const { room = 'global', page = 1, limit = 20 } = req.query;
  const arr = messages[room] || [];
  const p = Math.max(1, parseInt(page));
  const l = Math.max(1, parseInt(limit));
  const start = Math.max(0, arr.length - p * l);
  const end = arr.length - (p - 1) * l;
  const pageItems = arr.slice(start, end);
  res.json({ total: arr.length, page: p, limit: l, data: pageItems });
});

// image/file endpoint using multer (optional) - for demo we can accept base64 via socket, so not necessary

// Socket.io logic
io.on('connection', (socket) => {
  console.log('socket connected', socket.id);

  // User provides username when connecting via 'auth' event
  socket.on('auth', ({ username }, cb) => {
    if (!username) return cb && cb({ ok: false, error: 'Username required' });
    users[socket.id] = { username, socketId: socket.id, online: true, currentRoom: 'global' };
    socket.join('global');
    rooms.add('global');
    messages['global'] = messages['global'] || [];

    // notify others
    io.emit('user:list', Object.values(users).map(u => ({ username: u.username, socketId: u.socketId, online: u.online, currentRoom: u.currentRoom })));
    socket.broadcast.emit('notification', { type: 'join', username });
    cb && cb({ ok: true, socketId: socket.id });
  });

  // join room
  socket.on('join', ({ room }, cb) => {
    if (!room) return cb && cb({ ok: false, error: 'Room required' });
    socket.join(room);
    rooms.add(room);
    messages[room] = messages[room] || [];
    if (users[socket.id]) users[socket.id].currentRoom = room;
    io.to(room).emit('notification', { type: 'join-room', room, username: users[socket.id]?.username });
    io.emit('room:list', Array.from(rooms));
    cb && cb({ ok: true });
  });

  // leave room
  socket.on('leave', ({ room }, cb) => {
    socket.leave(room);
    if (users[socket.id]) users[socket.id].currentRoom = 'global';
    io.to(room).emit('notification', { type: 'leave-room', room, username: users[socket.id]?.username });
    cb && cb({ ok: true });
  });

  // typing indicator
  socket.on('typing', ({ room, isTyping }) => {
    const u = users[socket.id];
    if (!u) return;
    socket.to(room).emit('typing', { username: u.username, isTyping });
  });

  // send message: supports room or private 'to' userId, attachments (base64), reactions later
  socket.on('message', (payload, ack) => {
    // payload: { room, to (optional - socketId for private), text, attachments: [{name, data}] }
    const id = nanoid();
    const timestamp = Date.now();
    const fromUser = users[socket.id];
    if (!fromUser) return ack && ack({ ok: false, error: 'Not authenticated' });

    const msg = {
      id,
      room: payload.room || 'global',
      from: { username: fromUser.username, socketId: socket.id },
      to: payload.to || null,
      text: payload.text || '',
      attachments: payload.attachments || [],
      timestamp,
      readBy: payload.to ? [] : [socket.id], // sender has read
      reactions: {}, // {emoji: [socketId,...]}
    };

    messages[msg.room] = messages[msg.room] || [];
    messages[msg.room].push(msg);

    if (msg.to) {
      // private: send to target socket + sender
      io.to(msg.to).to(socket.id).emit('message', msg);
      // notify receiver
      io.to(msg.to).emit('notification', { type: 'private-message', from: fromUser.username });
    } else {
      // broadcast to room
      io.to(msg.room).emit('message', msg);
      // send notification to users not in room? skipped for brevity
    }

    // ack to sender
    ack && ack({ ok: true, id, timestamp });
  });

  // read receipt
  socket.on('message:read', ({ room, messageId }) => {
    const arr = messages[room] || [];
    const m = arr.find(x => x.id === messageId);
    if (m && !m.readBy.includes(socket.id)) {
      m.readBy.push(socket.id);
      io.to(room).emit('message:read', { messageId, by: socket.id });
    }
  });

  // reaction
  socket.on('message:react', ({ room, messageId, reaction }) => {
    const arr = messages[room] || [];
    const m = arr.find(x => x.id === messageId);
    if (!m) return;
    m.reactions[reaction] = m.reactions[reaction] || [];
    if (!m.reactions[reaction].includes(socket.id)) {
      m.reactions[reaction].push(socket.id);
    }
    io.to(room).emit('message:react', { messageId, reaction, by: socket.id, reactions: m.reactions });
  });

  // get online users
  socket.on('users:list', (cb) => {
    cb && cb(Object.values(users).map(u => ({ username: u.username, socketId: u.socketId, online: u.online, currentRoom: u.currentRoom })));
  });

  socket.on('disconnect', (reason) => {
    const u = users[socket.id];
    if (u) {
      u.online = false;
      console.log('user disconnected', u.username);
      delete users[socket.id]; // or keep with online:false
      io.emit('user:list', Object.values(users).map(u => ({ username: u.username, socketId: u.socketId, online: u.online, currentRoom: u.currentRoom })));
      io.emit('notification', { type: 'leave', username: u.username });
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log('Server listening on', PORT));
