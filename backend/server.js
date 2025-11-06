// server.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { addUser, removeUser, getUserList } = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // replace with your React frontend URL if needed
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// --- Basic route to test server ---
app.get('/', (req, res) => {
  res.send('Socket.io Chat Server Running...');
});

// --- Socket.io Events ---
io.on('connection', (socket) => {
  console.log(` User connected: ${socket.id}`);

  // When a new user joins with username
  socket.on('join', (username) => {
    addUser(socket.id, username);
    io.emit('userList', getUserList());
    io.emit('notification', `${username} joined the chat`);
  });

  // Listen for chat messages
  socket.on('chatMessage', (data) => {
    io.emit('message', {
      user: data.user,
      text: data.text,
      time: new Date().toLocaleTimeString(),
    });
  });

  // Typing indicator
  socket.on('typing', (username) => {
    socket.broadcast.emit('typing', username);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const username = removeUser(socket.id);
    io.emit('userList', getUserList());
    io.emit('notification', `${username || 'A user'} left the chat`);
    console.log(` User disconnected: ${socket.id}`);
  });
});

// --- Start Server ---
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(` Server running on port ${PORT}`));
