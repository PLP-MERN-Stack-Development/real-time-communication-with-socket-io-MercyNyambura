// src/socket.js
import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
  transports: ["websocket"], // ensures a stable connection
});

// Test connection
socket.on("connect", () => {
  console.log(" Connected to server:", socket.id);
});

// Receive messages
socket.on("message", (msg) => {
  console.log(" New message:", msg);
});

export default socket;


/*import { io } from "socket.io-client";

// Replace this URL with your backend server URL if deployed
const socket = io("http://localhost:5000", {
  transports: ["websocket"], // ensures WebSocket connection
});

export default socket;*/
