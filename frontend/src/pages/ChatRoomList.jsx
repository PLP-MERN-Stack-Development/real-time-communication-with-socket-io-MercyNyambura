import { useEffect, useState } from "react";
import API from "../services/api";
import { Link } from "react-router-dom";

export default function ChatRoomList() {
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    API.get("chats").then((res) => setRooms(res.data));
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>Available Rooms</h2>
      {rooms.map((room) => (
        <p key={room._id}>
          <Link to={`/chat/${room._id}`}>{room.name}</Link>
        </p>
      ))}
    </div>
  );
}
