import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { createRoom, getRooms } from "../controllers/chatController.js";

const router = express.Router();

router.post("/", protect, createRoom);
router.get("/", protect, getRooms);

export default router;
