import Message from "../models/Message.js";

export const sendMessage = async (req, res) => {
  const { room, text } = req.body;

  const message = await Message.create({
    sender: req.user._id,
    room,
    text
  });

  return res.json(message);
};

export const getRoomMessages = async (req, res) => {
  const messages = await Message.find({ room: req.params.id })
    .populate("sender", "username")
    .sort({ createdAt: 1 });

  return res.json(messages);
};
