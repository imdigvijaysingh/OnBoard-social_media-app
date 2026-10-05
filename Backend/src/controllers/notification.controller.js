import * as notificationService from "../services/notification.service.js";
import notificationModel from "../models/notification.model.js";

/**
 * 1. Get paginated notifications
 */
export async function getNotifications(req, res) {
  try {
    const userId = req.user.id;
    const { category = "all", page = 1, limit = 25 } = req.query;

    const result = await notificationService.getNotifications(userId, {
      category,
      page,
      limit,
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error("Error in getNotifications controller:", err);
    return res.status(500).json({ message: "Failed to fetch notifications" });
  }
}

/**
 * 2. Get unread count + latest notification preview for sidebar
 */
export async function getUnreadCount(req, res) {
  try {
    const userId = req.user.id;
    const unreadCount = await notificationService.getUnreadCount(userId);

    // Also fetch the most recent unread notification for smart toast previews
    const latestNotification = await notificationModel
      .findOne({ recipient: userId, status: "unread" })
      .sort({ createdAt: -1 })
      .populate("actor", "firstName lastName")
      .lean();

    return res.status(200).json({
      unreadCount,
      latestNotification: latestNotification || null,
    });
  } catch (err) {
    console.error("Error in getUnreadCount controller:", err);
    return res.status(500).json({ message: "Failed to fetch unread count" });
  }
}

/**
 * 3. Mark a specific notification as read
 */
export async function markAsRead(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const updated = await notificationService.markAsRead(userId, id);
    if (!updated) {
      return res.status(404).json({ message: "Notification not found or unauthorized" });
    }

    return res.status(200).json({ message: "Notification marked as read", notification: updated });
  } catch (err) {
    console.error("Error in markAsRead controller:", err);
    return res.status(500).json({ message: "Failed to mark notification as read" });
  }
}

/**
 * 4. Mark a specific notification as unread
 */
export async function markAsUnread(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const updated = await notificationService.markAsUnread(userId, id);
    if (!updated) {
      return res.status(404).json({ message: "Notification not found or unauthorized" });
    }

    return res.status(200).json({ message: "Notification marked as unread", notification: updated });
  } catch (err) {
    console.error("Error in markAsUnread controller:", err);
    return res.status(500).json({ message: "Failed to mark notification as unread" });
  }
}

/**
 * 5. Mark all notifications as read
 */
export async function markAllAsRead(req, res) {
  try {
    const userId = req.user.id;
    const { category } = req.body;

    const modifiedCount = await notificationService.markAllAsRead(userId, category);
    return res.status(200).json({ message: "All notifications marked as read", modifiedCount });
  } catch (err) {
    console.error("Error in markAllAsRead controller:", err);
    return res.status(500).json({ message: "Failed to mark all as read" });
  }
}

/**
 * 6. In-notification action (Boarding accept/decline, Experience RSVP)
 */
export async function performAction(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { action, payload } = req.body;

    if (!action) {
      return res.status(400).json({ message: "Action is required" });
    }

    const result = await notificationService.performNotificationAction(
      userId,
      id,
      action,
      payload
    );

    return res.status(200).json({ message: "Action performed successfully", result });
  } catch (err) {
    console.error("Error in performAction controller:", err);
    const status = err.status || 500;
    return res.status(status).json({ message: err.message || "Failed to perform action" });
  }
}

/**
 * 7. Delete notification (blocks security events)
 */
export async function deleteNotification(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const success = await notificationService.deleteNotification(userId, id);
    if (!success) {
      return res.status(404).json({ message: "Notification not found" });
    }

    return res.status(200).json({ message: "Notification deleted successfully" });
  } catch (err) {
    console.error("Error in deleteNotification controller:", err);
    const status = err.status || 500;
    return res.status(status).json({ message: err.message || "Failed to delete notification" });
  }
}

/**
 * 8. Security Activity: get active sessions & immutable audit history
 */
export async function getSecurityActivity(req, res) {
  try {
    const userId = req.user.id;
    const result = await notificationService.getSecurityActivity(userId);
    return res.status(200).json(result);
  } catch (err) {
    console.error("Error in getSecurityActivity controller:", err);
    return res.status(500).json({ message: "Failed to fetch security activity" });
  }
}

/**
 * 9. Revoke a specific session
 */
export async function revokeSession(req, res) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const revoked = await notificationService.revokeSession(userId, id);
    if (!revoked) {
      return res.status(404).json({ message: "Session not found or already revoked" });
    }

    return res.status(200).json({ message: "Session revoked successfully" });
  } catch (err) {
    console.error("Error in revokeSession controller:", err);
    return res.status(500).json({ message: "Failed to revoke session" });
  }
}

/**
 * 10. Revoke all other sessions
 */
export async function revokeOtherSessions(req, res) {
  try {
    const userId = req.user.id;
    const currentSessionId = req.user.sessionId || null;

    const count = await notificationService.revokeAllOtherSessions(userId, currentSessionId);
    return res.status(200).json({ message: "Other sessions revoked successfully", count });
  } catch (err) {
    console.error("Error in revokeOtherSessions controller:", err);
    return res.status(500).json({ message: "Failed to revoke other sessions" });
  }
}

/**
 * 11. Notification Preferences
 */
export async function getPreferences(req, res) {
  try {
    const userId = req.user.id;
    const prefs = await notificationService.getPreferences(userId);
    return res.status(200).json({ preferences: prefs });
  } catch (err) {
    console.error("Error in getPreferences controller:", err);
    return res.status(500).json({ message: "Failed to fetch notification preferences" });
  }
}

export async function updatePreferences(req, res) {
  try {
    const userId = req.user.id;
    const updated = await notificationService.updatePreferences(userId, req.body);
    return res.status(200).json({ message: "Preferences updated successfully", preferences: updated });
  } catch (err) {
    console.error("Error in updatePreferences controller:", err);
    return res.status(500).json({ message: "Failed to update notification preferences" });
  }
}
