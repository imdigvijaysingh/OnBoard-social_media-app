import express from "express";
import { authUser } from "../middlewares/auth.middleware.js";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAsUnread,
  markAllAsRead,
  performAction,
  deleteNotification,
  getSecurityActivity,
  revokeSession,
  revokeOtherSessions,
  getPreferences,
  updatePreferences,
} from "../controllers/notification.controller.js";

const notificationRouter = express.Router();

// All notification routes require authentication
notificationRouter.use(authUser);

// Notification Feed & Counts
notificationRouter.get("/", getNotifications);
notificationRouter.get("/unread-count", getUnreadCount);
notificationRouter.patch("/read-all", markAllAsRead);

// Single Notification Interactions
notificationRouter.patch("/:id/read", markAsRead);
notificationRouter.patch("/:id/unread", markAsUnread);
notificationRouter.post("/:id/action", performAction);
notificationRouter.delete("/:id", deleteNotification);

// Security Activity
notificationRouter.get("/security/activity", getSecurityActivity);
notificationRouter.post("/security/sessions/:id/revoke", revokeSession);
notificationRouter.post("/security/sessions/revoke-others", revokeOtherSessions);

// Notification Preferences
notificationRouter.get("/settings", getPreferences);
notificationRouter.patch("/settings", updatePreferences);

export default notificationRouter;
