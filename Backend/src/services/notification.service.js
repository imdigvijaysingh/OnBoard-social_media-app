import mongoose from "mongoose";
import notificationModel from "../models/notification.model.js";
import securityEventModel from "../models/securityEvent.model.js";
import notificationPreferenceModel from "../models/notificationPreference.model.js";
import profileModel from "../models/profile.model.js";
import userModel from "../models/user.model.js";
import sessionModel from "../models/session.model.js";

/**
 * Helper to get actor display name and avatar
 */
async function getActorDetails(actorId) {
  if (!actorId) return { name: "OnBoard", avatar: "", userName: "onboard" };
  const user = await userModel.findById(actorId).select("firstName lastName").lean();
  const profile = await profileModel.findOne({ user: actorId }).select("userName profilePhoto").lean();
  const name = user ? `${user.firstName} ${user.lastName || ""}`.trim() : "Traveler";
  return {
    name,
    avatar: profile?.profilePhoto || "",
    userName: profile?.userName || "traveler",
  };
}

/**
 * 1. Create a single notification with self-action protection and idempotency
 */
export async function createNotification({
  recipient,
  actor = null,
  type,
  category = "social",
  priority = "normal",
  title,
  body,
  entityType = "system",
  entityId = null,
  deepLink = "/notifications",
  metadata = {},
  sourceEventId = null,
  actionType = "none",
  ttlDays = null,
}) {
  try {
    if (!recipient) return null;

    // Self-action protection: never notify user of their own actions
    if (actor && actor.toString() === recipient.toString()) {
      return null;
    }

    // Idempotency check with compound (recipient + sourceEventId)
    if (sourceEventId) {
      const existing = await notificationModel.findOne({
        recipient,
        sourceEventId,
      });
      if (existing) {
        return existing;
      }
    }

    // Determine retention expiration (TTL)
    let retentionDays = ttlDays;
    if (!retentionDays) {
      if (category === "social") retentionDays = 30;
      else if (category === "security") retentionDays = 180;
      else retentionDays = 60;
    }
    const expiresAt = new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000);

    // Actor details
    let actorsList = [];
    if (actor) {
      const actorInfo = await getActorDetails(actor);
      actorsList.push({
        user: actor,
        name: actorInfo.name,
        avatar: actorInfo.avatar,
        actionTime: new Date(),
      });
    }

    const notification = await notificationModel.create({
      recipient,
      actor,
      actors: actorsList,
      type,
      category,
      priority,
      title,
      body,
      entityType,
      entityId,
      deepLink,
      metadata,
      sourceEventId,
      actionType,
      expiresAt,
    });

    return notification;
  } catch (err) {
    // If duplicate key error on compound index { recipient: 1, sourceEventId: 1 }, handle gracefully
    if (err.code === 11000) {
      return await notificationModel.findOne({ recipient, sourceEventId });
    }
    console.error("Error creating notification:", err);
    return null;
  }
}

/**
 * 2. Create an atomic grouped notification (e.g. "Maya, Aman and 8 others liked your post")
 * Bounds the actors array to latest 10 representative actors while groupCount tracks total.
 */
export async function createGroupedNotification({
  recipient,
  actor,
  type,
  category = "social",
  priority = "low",
  groupKey,
  entityType = "post",
  entityId = null,
  deepLink = "/feed",
  targetTitle = "post",
  metadata = {},
  ttlDays = 30,
}) {
  try {
    if (!recipient || !actor || !groupKey) return null;

    // Self-action protection
    if (actor.toString() === recipient.toString()) {
      return null;
    }

    const actorInfo = await getActorDetails(actor);
    const actorItem = {
      user: actor,
      name: actorInfo.name,
      avatar: actorInfo.avatar,
      actionTime: new Date(),
    };

    // Find active unread notification for recipient with same groupKey in the last 24h
    const windowStart = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existing = await notificationModel.findOne({
      recipient,
      groupKey,
      status: "unread",
      createdAt: { $gte: windowStart },
    });

    if (existing) {
      // Check if this actor already contributed to the group recently
      const alreadyContributed = existing.actors.some(
        (a) => a.user?.toString() === actor.toString()
      );

      const newGroupCount = alreadyContributed ? existing.groupCount : existing.groupCount + 1;
      const otherCount = newGroupCount - 1;

      let updatedTitle = "";
      let updatedBody = "";

      if (type === "LIKE") {
        updatedTitle = `${actorInfo.name} and others liked your ${targetTitle}`;
        updatedBody =
          otherCount > 0
            ? `${actorInfo.name} and ${otherCount} other${otherCount > 1 ? "s" : ""} liked your ${targetTitle}`
            : `${actorInfo.name} liked your ${targetTitle}`;
      } else if (type === "REACTION") {
        const emoji = metadata.emoji || "❤️";
        updatedTitle = `${actorInfo.name} and others reacted to your message`;
        updatedBody =
          otherCount > 0
            ? `${actorInfo.name} and ${otherCount} others reacted ${emoji}`
            : `${actorInfo.name} reacted ${emoji}`;
      } else {
        updatedTitle = `${actorInfo.name} and others interacted with your ${targetTitle}`;
        updatedBody = `${actorInfo.name} and ${otherCount} others interacted with your ${targetTitle}`;
      }

      // Atomic update using MongoDB operators, keeping max 10 latest actors
      const updated = await notificationModel.findOneAndUpdate(
        { _id: existing._id },
        {
          $inc: alreadyContributed ? {} : { groupCount: 1 },
          $set: {
            actor, // latest actor
            title: updatedTitle,
            body: updatedBody,
            deepLink,
            metadata: { ...existing.metadata, ...metadata },
            updatedAt: new Date(),
          },
          $push: {
            actors: {
              $each: [actorItem],
              $slice: -10, // bound array to latest 10
            },
          },
        },
        { new: true }
      );

      return updated;
    } else {
      // Create new notification base
      const title = `${actorInfo.name} liked your ${targetTitle}`;
      const body = `${actorInfo.name} liked your ${targetTitle}`;
      const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

      const created = await notificationModel.create({
        recipient,
        actor,
        actors: [actorItem],
        type,
        category,
        priority,
        title,
        body,
        entityType,
        entityId,
        deepLink,
        metadata,
        groupKey,
        groupCount: 1,
        status: "unread",
        expiresAt,
      });

      return created;
    }
  } catch (err) {
    console.error("Error creating grouped notification:", err);
    return null;
  }
}

/**
 * 3. Record Security Event and conditionally trigger a user alert
 */
export async function recordSecurityEvent({
  userId,
  sessionId = null,
  eventType,
  device = "Browser",
  browser = "Chrome",
  os = "Windows",
  ip = "127.0.0.1",
  approximateLocation = "Local Network",
  metadata = {},
  notifyUser = false,
}) {
  try {
    const secEvent = await securityEventModel.create({
      user: userId,
      sessionId,
      eventType,
      device,
      browser,
      os,
      ip,
      approximateLocation,
      metadata,
      timestamp: new Date(),
    });

    // Only notify user for meaningful security events (new device, password changes, failed attempts)
    if (notifyUser) {
      let title = "Security Alert";
      let body = "A security event was recorded on your account.";
      let actionType = "review_security";

      if (eventType === "LOGIN_NEW_DEVICE") {
        title = "New Device Login Detected";
        body = `We detected a new sign-in from ${device} (${browser}) in ${approximateLocation}.`;
      } else if (eventType === "PASSWORD_CHANGED") {
        title = "Password Changed";
        body = "Your OnBoard account password was changed successfully.";
      } else if (eventType === "SESSION_REVOKED") {
        title = "Session Terminated";
        body = "An active session on your account was revoked.";
      } else if (eventType === "LOGIN_FAILED_THRESHOLD") {
        title = "Multiple Unsuccessful Login Attempts";
        body = `Several failed login attempts were detected from ${ip}. If this wasn't you, review your account security.`;
      }

      await createNotification({
        recipient: userId,
        actor: null,
        type: eventType,
        category: "security",
        priority: "critical",
        title,
        body,
        entityType: "securityEvent",
        entityId: secEvent._id,
        deepLink: "/notifications?tab=security",
        metadata: {
          device,
          browser,
          approximateLocation,
          timestamp: new Date(),
        },
        actionType,
        ttlDays: 180,
      });
    }

    return secEvent;
  } catch (err) {
    console.error("Error recording security event:", err);
    return null;
  }
}

/**
 * 4. Get paginated notifications with populated actor metadata
 */
export async function getNotifications(userId, { category = "all", page = 1, limit = 25 }) {
  try {
    const query = { recipient: userId };
    if (category && category !== "all") {
      query.category = category;
    }

    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 25, 5), 100);
    const skip = (parsedPage - 1) * parsedLimit;

    const [rawNotifications, totalCount, unreadCount] = await Promise.all([
      notificationModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit)
        .populate("actor", "firstName lastName email")
        .populate("actors.user", "firstName lastName")
        .lean(),
      notificationModel.countDocuments(query),
      notificationModel.countDocuments({ recipient: userId, status: "unread" }),
    ]);

    // Populate profile pictures and usernames for actors
    const actorUserIds = [
      ...new Set(
        rawNotifications
          .map((n) => n.actor?._id?.toString())
          .filter(Boolean)
      ),
    ];
    const profiles = await profileModel
      .find({ user: { $in: actorUserIds } })
      .select("user userName profilePhoto")
      .lean();
    const profileMap = new Map();
    profiles.forEach((p) => profileMap.set(p.user.toString(), p));

    const enriched = rawNotifications.map((notif) => {
      const aId = notif.actor?._id ? notif.actor._id.toString() : (notif.actor ? notif.actor.toString() : null);
      const prof = aId ? profileMap.get(aId) : null;
      const defaultName = notif.actor
        ? `${notif.actor.firstName || ""} ${notif.actor.lastName || ""}`.trim()
        : notif.category === "security"
        ? "Security System"
        : "OnBoard";

      return {
        ...notif,
        actorId: aId,
        actorName: defaultName || "Crew Member",
        actorUserName: prof?.userName || "",
        actorAvatar: prof?.profilePhoto || "",
      };
    });

    return {
      notifications: enriched,
      totalCount,
      unreadCount,
      page: parsedPage,
      totalPages: Math.ceil(totalCount / parsedLimit),
      hasMore: skip + enriched.length < totalCount,
    };
  } catch (err) {
    console.error("Error in getNotifications service:", err);
    throw err;
  }
}

/**
 * 5. Get fast unread count for sidebar indicator
 */
export async function getUnreadCount(userId) {
  return await notificationModel.countDocuments({
    recipient: userId,
    status: "unread",
  });
}

/**
 * 6. Mark a single notification as read
 */
export async function markAsRead(userId, notificationId) {
  const notif = await notificationModel.findOne({
    _id: notificationId,
    recipient: userId,
  });
  if (!notif) return null;

  notif.status = notif.status === "actioned" ? "actioned" : "read";
  notif.readAt = new Date();
  await notif.save();
  return notif;
}

/**
 * 7. Mark a single notification as unread
 */
export async function markAsUnread(userId, notificationId) {
  const notif = await notificationModel.findOne({
    _id: notificationId,
    recipient: userId,
  });
  if (!notif) return null;

  notif.status = "unread";
  notif.readAt = null;
  await notif.save();
  return notif;
}

/**
 * 8. Mark all notifications as read (optionally by category)
 */
export async function markAllAsRead(userId, category = null) {
  const query = { recipient: userId, status: "unread" };
  if (category && category !== "all") {
    query.category = category;
  }
  const result = await notificationModel.updateMany(query, {
    $set: { status: "read", readAt: new Date() },
  });
  return result.modifiedCount;
}

/**
 * 9. Perform in-notification action (Boarding accept/decline, Experience RSVP)
 */
export async function performNotificationAction(userId, notificationId, action, payload = {}) {
  const notif = await notificationModel.findOne({
    _id: notificationId,
    recipient: userId,
  });

  if (!notif) {
    const error = new Error("Notification not found or unauthorized");
    error.status = 404;
    throw error;
  }

  // Action: Accept or Reject Boarding Request
  if (notif.actionType === "accept_decline_board") {
    const targetUserId = notif.actor?._id || notif.entityId;
    const currentUserProfile = await profileModel.findOne({ user: userId });
    const targetUserProfile = await profileModel.findOne({ user: targetUserId });

    if (action === "accept") {
      if (currentUserProfile && targetUserProfile) {
        currentUserProfile.boardRequests = currentUserProfile.boardRequests.filter(
          (r) => r.user.toString() !== targetUserId.toString()
        );
        if (!currentUserProfile.boards.includes(targetUserId)) {
          currentUserProfile.boards.push(targetUserId);
        }
        if (!targetUserProfile.boards.includes(userId)) {
          targetUserProfile.boards.push(userId);
        }
        await currentUserProfile.save();
        await targetUserProfile.save();

        // Notify requester that request was accepted
        await createNotification({
          recipient: targetUserId,
          actor: userId,
          type: "BOARDING_ACCEPTED",
          category: "crews",
          priority: "high",
          title: "Boarding Request Accepted",
          body: `${currentUserProfile.userName || "Your friend"} accepted your boarding request! You are now Crew.`,
          deepLink: `/my-profile`,
        });
      }
      notif.status = "actioned";
      notif.actionResult = "accepted";
      notif.actionedAt = new Date();
      await notif.save();
      return { success: true, action: "accepted" };
    } else if (action === "decline") {
      if (currentUserProfile) {
        currentUserProfile.boardRequests = currentUserProfile.boardRequests.filter(
          (r) => r.user.toString() !== targetUserId.toString()
        );
        await currentUserProfile.save();
      }
      notif.status = "actioned";
      notif.actionResult = "declined";
      notif.actionedAt = new Date();
      await notif.save();
      return { success: true, action: "declined" };
    }
  }

  // Action: Experience RSVP
  if (notif.actionType === "experience_rsvp") {
    notif.status = "actioned";
    notif.actionResult = action; // 'going', 'maybe', 'cant_go'
    notif.actionedAt = new Date();
    await notif.save();
    return { success: true, action };
  }

  notif.status = "actioned";
  notif.actionResult = action;
  notif.actionedAt = new Date();
  await notif.save();
  return { success: true, action };
}

/**
 * 10. Delete a single notification (Disallows deleting security history)
 */
export async function deleteNotification(userId, notificationId) {
  const notif = await notificationModel.findOne({
    _id: notificationId,
    recipient: userId,
  });

  if (!notif) return false;

  // Security events cannot be deleted to preserve audit integrity
  if (notif.category === "security") {
    const error = new Error("Security audit records cannot be deleted.");
    error.status = 403;
    throw error;
  }

  await notificationModel.deleteOne({ _id: notificationId });
  return true;
}

/**
 * 11. Security Activity: fetch active sessions and immutable audit history
 */
export async function getSecurityActivity(userId) {
  const [sessions, auditHistory] = await Promise.all([
    sessionModel.find({ user: userId, revoked: false }).sort({ createdAt: -1 }).lean(),
    securityEventModel.find({ user: userId }).sort({ timestamp: -1 }).limit(50).lean(),
  ]);

  return { sessions, auditHistory };
}

/**
 * 12. Revoke a specific session
 */
export async function revokeSession(userId, sessionId) {
  const session = await sessionModel.findOneAndUpdate(
    { _id: sessionId, user: userId },
    { $set: { revoked: true } },
    { new: true }
  );

  if (session) {
    await recordSecurityEvent({
      userId,
      sessionId,
      eventType: "SESSION_REVOKED",
      device: session.userAgent || "Device",
      ip: session.ip || "127.0.0.1",
      notifyUser: false,
    });
  }

  return session;
}

/**
 * 13. Revoke all other sessions except current
 */
export async function revokeAllOtherSessions(userId, currentSessionId) {
  const filter = { user: userId, revoked: false };
  if (currentSessionId) {
    filter._id = { $ne: currentSessionId };
  }

  const result = await sessionModel.updateMany(filter, { $set: { revoked: true } });

  await recordSecurityEvent({
    userId,
    eventType: "SESSION_REVOKED",
    metadata: { count: result.modifiedCount },
    notifyUser: true,
  });

  return result.modifiedCount;
}

/**
 * 14. Preferences: get or create user notification preferences
 */
export async function getPreferences(userId) {
  let prefs = await notificationPreferenceModel.findOne({ user: userId });
  if (!prefs) {
    prefs = await notificationPreferenceModel.create({ user: userId });
  }
  return prefs;
}

/**
 * 15. Preferences: update user notification preferences
 */
export async function updatePreferences(userId, updateData) {
  // Enforce security-critical settings to stay true
  if (updateData.security) {
    updateData.security.newLogin = true;
    updateData.security.passwordChanged = true;
    updateData.security.sessionRevoked = true;
  }

  const prefs = await notificationPreferenceModel.findOneAndUpdate(
    { user: userId },
    { $set: updateData },
    { new: true, upsert: true }
  );
  return prefs;
}
