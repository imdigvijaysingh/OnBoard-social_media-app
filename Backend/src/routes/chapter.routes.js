import express from "express";
import {
  createChapter,
  getMyChapters,
  getUserChapters,
  getChapterById,
  updateChapter,
  deleteChapter,
  addPostsToChapter,
} from "../controllers/chapter.controller.js";
import * as authMiddleware from "../middlewares/auth.middleware.js";

const chapterRouter = express.Router();

// Current user chapters
chapterRouter.get("/me", authMiddleware.authUser, getMyChapters);

// Another user's public chapters
chapterRouter.get("/user/:userId", authMiddleware.optionalAuthUser, getUserChapters);

// Chapter CRUD
chapterRouter.post("/", authMiddleware.authUser, createChapter);
chapterRouter.get("/:id", authMiddleware.optionalAuthUser, getChapterById);
chapterRouter.put("/:id", authMiddleware.authUser, updateChapter);
chapterRouter.delete("/:id", authMiddleware.authUser, deleteChapter);
chapterRouter.post("/:id/add-posts", authMiddleware.authUser, addPostsToChapter);

export default chapterRouter;
