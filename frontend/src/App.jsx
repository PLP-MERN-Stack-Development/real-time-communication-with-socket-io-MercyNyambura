import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import ChatRoomList from "./pages/ChatRoomList";
import ChatWindow from "./pages/ChatWindow";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/rooms" element={<ChatRoomList />} />
        <Route path="/chat/:id" element={<ChatWindow />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
