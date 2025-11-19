import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

export const loginUser = async (req, res) => {
  const { username } = req.body;

  if (!username)
    return res.status(400).json({ message: "Username required" });

  let user = await User.findOne({ username });

  if (!user) user = await User.create({ username });

  return res.json({
    token: generateToken(username),
    user
  });
};
