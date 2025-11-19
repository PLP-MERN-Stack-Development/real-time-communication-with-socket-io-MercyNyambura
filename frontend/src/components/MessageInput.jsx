import { useState } from "react";
import API from "../services/api";

export default function MessageInput({ roomId, socket }) {
  const [text, setText] = useState("");

  const sendMessage = async () => {
    const res = await API.post("messages", {
      room: roomId,
      text,
    });

    socket.current.emit("sendMessage", res.data);
    setText("");
  };

  return (
    <div style={{ marginTop: 10 }}>
      <input
        style={{ width: "80%" }}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type message…"
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}
