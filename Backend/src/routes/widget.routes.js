import express from "express";
import { authUser } from "../middlewares/auth.middleware.js";
import {
  createPoll,
  votePoll,
  createChecklist,
  toggleChecklistItem,
  addChecklistItem,
  createMeetingPoint,
  checkInMeetingPoint,
  createQuestion,
  answerQuestion,
  getWidgetDetails,
} from "../controllers/widget.controller.js";

const widgetRouter = express.Router();

widgetRouter.use(authUser);

// Polls
widgetRouter.post("/poll", createPoll);
widgetRouter.post("/poll/:widgetId/vote", votePoll);

// Checklists
widgetRouter.post("/checklist", createChecklist);
widgetRouter.patch("/checklist/:widgetId/item/:itemId", toggleChecklistItem);
widgetRouter.post("/checklist/:widgetId/item", addChecklistItem);

// Meeting Points
widgetRouter.post("/meeting-point", createMeetingPoint);
widgetRouter.post("/meeting-point/:widgetId/checkin", checkInMeetingPoint);

// Questions
widgetRouter.post("/question", createQuestion);
widgetRouter.post("/question/:widgetId/answer", answerQuestion);

// Details
widgetRouter.get("/:widgetId", getWidgetDetails);

export default widgetRouter;
