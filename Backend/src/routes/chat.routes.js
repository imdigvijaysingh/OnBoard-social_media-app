import express from "express";
import { authUser } from "../middlewares/auth.middleware.js";
import {
  getConversations,
  getOrCreateDirectChat,
  getMessages,
  sendMessage,
  markConversationRead,
  toggleReaction,
  editMessage,
  deleteMessage,
  createChapter,
  getChapters,
  getChapterMessages,
  addMessagesToChapter,
  deleteChapter,
  getYouAndPersonStats,
  saveContactIdentity,
  saveCrewIdentity,
  searchConversation,
} from "../controllers/chat.controller.js";
import locationRouter from "./location.routes.js";
import widgetRouter from "./widget.routes.js";
import experienceRouter from "./experience.routes.js";
import momentRouter from "./moment.routes.js";

const chatRouter = express.Router();

// All chat routes require authentication
chatRouter.use(authUser);

// Subsystems
chatRouter.use("/location", locationRouter);
chatRouter.use("/widgets", widgetRouter);
chatRouter.use("/experiences", experienceRouter);
chatRouter.use("/moments", momentRouter);

// Conversations
chatRouter.get("/conversations", getConversations);
chatRouter.post("/conversations/direct", getOrCreateDirectChat);
chatRouter.get("/conversations/:conversationId/search", searchConversation);

// Messages
chatRouter.get("/conversations/:conversationId/messages", getMessages);
chatRouter.post("/conversations/:conversationId/messages", sendMessage);
chatRouter.post("/conversations/:conversationId/read", markConversationRead);

// Message interactions
chatRouter.post("/messages/:messageId/reaction", toggleReaction);
chatRouter.put("/messages/:messageId", editMessage);
chatRouter.delete("/messages/:messageId", deleteMessage);

// Chapters / Custom Categories
chatRouter.post("/conversations/:conversationId/chapters", createChapter);
chatRouter.get("/conversations/:conversationId/chapters", getChapters);
chatRouter.get("/chapters/:chapterId/messages", getChapterMessages);
chatRouter.post("/chapters/:chapterId/messages", addMessagesToChapter);
chatRouter.delete("/chapters/:chapterId", deleteChapter);

import multer from "multer";
import uploadFile from "../services/storage.service.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Relationship & Identity
chatRouter.get("/relationship/:targetUserId", getYouAndPersonStats);
chatRouter.post("/contact-identity", saveContactIdentity);
chatRouter.post("/crew-identity", saveCrewIdentity);
chatRouter.post("/upload-avatar", upload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }
    const result = await uploadFile(req.file.buffer);
    return res.status(200).json({ url: result.url });
  } catch (err) {
    console.error("Failed to upload avatar:", err);
    return res.status(500).json({ message: "Failed to upload avatar image" });
  }
});

export default chatRouter;
