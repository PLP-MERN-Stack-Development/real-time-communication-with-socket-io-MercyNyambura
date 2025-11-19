import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import API from "../services/api";
import { io } from "socket.io-client";
import Message from "../components/Message";
import MessageInput from "../components/MessageInput";

export default function ChatWindow() {
  const { id } = useParams();
  const [messages, setMessages] = useState([]);

  const socket = useRef(null);

  useEffect(() => {
    socket.current = io("http://localhost:5000");

    socket.current.emit("joinRoom", id);

    socket.current.on("newMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => socket.current.disconnect();
  }, [id]);

  useEffect(() => {
    API.get(`messages/${id}`).then((res) => setMessages(res.data));
  }, [id]);

  return (
    <div style={{ padding: 20 }}>
      <h2>Chat Room</h2>

      <div style={{ height: 400, overflowY: "auto", border: "1px solid #ddd" }}>
        {messages.map((msg) => (
          <Message key={msg._id} msg={msg} />
        ))}
      </div>

      <MessageInput roomId={id} socket={socket} />
    </div>
  );
}
