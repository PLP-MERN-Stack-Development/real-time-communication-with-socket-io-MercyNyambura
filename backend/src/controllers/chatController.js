import ChatRoom from "../models/ChatRoom.js";

export const createRoom = async (req, res) => {
  const { name, members } = req.body;

  const room = await ChatRoom.create({ name, members });

  return res.json(room);
};

export const getRooms = async (req, res) => {
  const rooms = await ChatRoom.find().populate("members", "username");
  return res.json(rooms);
};
