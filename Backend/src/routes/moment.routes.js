import express from "express";
import { authUser } from "../middlewares/auth.middleware.js";
import {
  createMoment,
  getConversationMoments,
  exportMomentToMemory,
} from "../controllers/moment.controller.js";

const momentRouter = express.Router();

momentRouter.use(authUser);

momentRouter.post("/", createMoment);
momentRouter.get("/conversation/:conversationId", getConversationMoments);
momentRouter.post("/:momentId/export-memory", exportMomentToMemory);

export default momentRouter;
