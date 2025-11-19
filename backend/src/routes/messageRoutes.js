import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { sendMessage, getRoomMessages } from "../controllers/messageController.js";

const router = express.Router();

router.post("/", protect, sendMessage);
router.get("/:id", protect, getRoomMessages);

export default router;
