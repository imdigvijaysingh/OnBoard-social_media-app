import express from "express";
import { authUser } from "../middlewares/auth.middleware.js";
import {
  createExperience,
  updateRsvp,
  getConversationExperiences,
  saveExperienceToBoard,
} from "../controllers/experience.controller.js";

const experienceRouter = express.Router();

experienceRouter.use(authUser);

experienceRouter.post("/", createExperience);
experienceRouter.patch("/:experienceId/rsvp", updateRsvp);
experienceRouter.get("/conversation/:conversationId", getConversationExperiences);
experienceRouter.post("/:experienceId/save-to-board", saveExperienceToBoard);

export default experienceRouter;
