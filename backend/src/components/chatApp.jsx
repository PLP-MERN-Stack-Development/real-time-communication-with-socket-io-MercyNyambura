import React, { useEffect, useState } from "react";
import socket from "../socket";

function ChatApp() {
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  // Connect to socket and listen for messages
  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected to server ");
      setIsConnected(true);
    });

    socket.on("receiveMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("userJoined", (name) => {
      setMessages((prev) => [...prev, { text: `${name} joined the chat `, system: true }]);
    });

    socket.on("userLeft", (name) => {
      setMessages((prev) => [...prev, { text: `${name} left the chat `, system: true }]);
    });

    return () => {
      socket.off("connect");
      socket.off("receiveMessage");
      socket.off("userJoined");
      socket.off("userLeft");
    };
  }, []);

  const joinChat = () => {
    if (username.trim()) {
      socket.emit("join", username);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      socket.emit("sendMessage", message);
      setMessage("");
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "50px auto", textAlign: "center" }}>
      {!isConnected && <p>Connecting to chat server...</p>}

      {!username ? (
        <div>
          <h2>Enter your username</h2>
          <input value={username} onChange={(e) => setUsername(e.target.value)} />
          <button onClick={joinChat}>Join</button>
        </div>
      ) : (
        <div>
          <h2>Welcome, {username} </h2>
          <div
            style={{
              border: "1px solid #ccc",
              height: 300,
              overflowY: "auto",
              padding: "10px",
              marginBottom: "10px",
            }}
          >
            {messages.map((m, i) => (
              <div key={i} style={{ color: m.system ? "gray" : "black" }}>
                {m.system ? (
                  <em>{m.text}</em>
                ) : (
                  <span><strong>{m.user}:</strong> {m.text}</span>
                )}
              </div>
            ))}
          </div>

          <form onSubmit={sendMessage}>
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              style={{ width: "70%" }}
            />
            <button type="submit">Send</button>
          </form>
        </div>
      )}
    </div>
  );
}

export default ChatApp;


