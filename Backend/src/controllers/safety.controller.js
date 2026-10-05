import profileModel from '../models/profile.model.js';
import userModel from '../models/user.model.js';
import reportModel from '../models/report.model.js';
import { ensureUserProfile } from './profile.controller.js';
import { createNotification } from '../services/notification.service.js';

/**
 * GET /api/safety/status
 * Get current user's community safety standing, trust score, badges, and alerts
 */
export async function getSafetyStatus(req, res) {
  try {
    const userId = req.user.id;
    let profile = await profileModel.findOne({ user: userId });

    if (!profile) {
      profile = await ensureUserProfile(userId);
    }

    const standing = profile?.communityStanding || "good_standing";
    const trustScore = profile?.trustScore !== undefined ? profile.trustScore : 100;
    const safetyBadges = profile?.safetyBadges && profile.safetyBadges.length > 0
      ? profile.safetyBadges
      : ["Verified Crew", "Anti-Spam Guardian", "Clean Record"];
    const blockedCount = (profile?.blockedUsers || []).length;

    // Active community guidelines & alerts
    const activeAlerts = [
      {
        id: "alert_spam_zero",
        level: "info",
        title: "🛡️ Zero-Spam Policy Active",
        message: "AI and crew moderation actively keep all cabins spam-free. Unsolicited marketing or repetitive promotional links will result in immediate restrictions.",
        date: "2026-09-01",
      },
      {
        id: "alert_friendly_crew",
        level: "success",
        title: "🤝 Friendly Cabin Code",
        message: "OnBoard is built for authentic human connection. Treat all crew members with empathy, respect, and cordiality.",
        date: "2026-09-15",
      },
    ];

    if (standing === "under_review") {
      activeAlerts.unshift({
        id: "alert_under_review",
        level: "warning",
        title: "⚠️ Account Under Review",
        message: "A safety notice was triggered on your account. Please review our Community Guidelines.",
        date: new Date().toISOString().split("T")[0],
      });
    }

    return res.status(200).json({
      standing,
      trustScore,
      safetyBadges,
      blockedCount,
      activeAlerts,
    });
  } catch (error) {
    console.error("getSafetyStatus error:", error);
    return res.status(500).json({ message: "Failed to fetch safety status", error: error.message });
  }
}

/**
 * POST /api/safety/report
 * Submit a community safety report for a post, member, or message
 */
export async function submitReport(req, res) {
  try {
    const reporterId = req.user.id;
    const { targetType, targetId, reason, details, blockTarget } = req.body;

    if (!targetType || !["post", "user", "message"].includes(targetType)) {
      return res.status(400).json({ message: "Valid targetType ('post', 'user', or 'message') is required" });
    }

    if (!targetId) {
      return res.status(400).json({ message: "Target ID is required" });
    }

    const validReasons = [
      "spam",
      "harassment",
      "inappropriate_media",
      "hate_speech",
      "impersonation",
      "other",
    ];
    if (!reason || !validReasons.includes(reason)) {
      return res.status(400).json({ message: `Reason must be one of: ${validReasons.join(", ")}` });
    }

    const newReport = await reportModel.create({
      reporter: reporterId,
      targetType,
      targetId,
      reason,
      details: details ? details.trim() : "",
      status: "pending",
    });

    // Optionally auto-block the user if requested
    if (blockTarget) {
      const userToBlock = targetType === "user" ? targetId : null;
      if (userToBlock && userToBlock.toString() !== reporterId.toString()) {
        const reporterProfile = await profileModel.findOne({ user: reporterId });
        if (reporterProfile) {
          if (!reporterProfile.blockedUsers) reporterProfile.blockedUsers = [];
          if (!reporterProfile.blockedUsers.includes(userToBlock)) {
            reporterProfile.blockedUsers.push(userToBlock);
            reporterProfile.boards.pull(userToBlock);
            await reporterProfile.save();
          }
        }
      }
    }

    // Send confirmation notification to reporter
    await createNotification({
      recipient: reporterId,
      actor: reporterId,
      type: "SECURITY_ALERT",
      category: "system",
      priority: "medium",
      title: "🛡️ Safety Report Received",
      body: "Thank you for alerting us. Our Community Trust & Safety team is reviewing the report to keep OnBoard safe.",
      entityType: "user",
      entityId: reporterId,
      deepLink: "/my-profile",
    }).catch(e => console.error("Report notif error:", e));

    return res.status(201).json({
      message: "Report submitted successfully. Thank you for keeping our community safe and spam-free.",
      reportId: newReport._id,
    });
  } catch (error) {
    console.error("submitReport error:", error);
    return res.status(500).json({ message: "Failed to submit report", error: error.message });
  }
}

/**
 * GET /api/safety/blocked
 * Get list of members blocked by current user
 */
export async function getBlockedUsers(req, res) {
  try {
    const userId = req.user.id;
    const profile = await profileModel.findOne({ user: userId });

    if (!profile || !profile.blockedUsers || profile.blockedUsers.length === 0) {
      return res.status(200).json({ blockedUsers: [] });
    }

    const blockedUserDocs = await userModel.find({ _id: { $in: profile.blockedUsers } }).select('firstName lastName email');
    const blockedProfiles = await profileModel.find({ user: { $in: profile.blockedUsers } });

    const blockedList = blockedUserDocs.map(u => {
      const p = blockedProfiles.find(prof => prof.user.toString() === u._id.toString());
      return {
        userId: u._id,
        name: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
        userName: p?.userName || "Crew Member",
        profilePhoto: p?.profilePhoto || "https://cdn-icons-png.flaticon.com/512/149/149071.png",
      };
    });

    return res.status(200).json({ blockedUsers: blockedList });
  } catch (error) {
    console.error("getBlockedUsers error:", error);
    return res.status(500).json({ message: "Failed to fetch blocked users", error: error.message });
  }
}

/**
 * POST /api/safety/block/:id
 * Block a user
 */
export async function blockUser(req, res) {
  try {
    const currentUserId = req.user.id;
    const targetUserId = req.params.id;

    if (currentUserId === targetUserId) {
      return res.status(400).json({ message: "You cannot block yourself" });
    }

    const currentProfile = await profileModel.findOne({ user: currentUserId });
    const targetProfile = await profileModel.findOne({ user: targetUserId });

    if (!currentProfile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    if (!currentProfile.blockedUsers) {
      currentProfile.blockedUsers = [];
    }

    if (!currentProfile.blockedUsers.includes(targetUserId)) {
      currentProfile.blockedUsers.push(targetUserId);
    }

    // Auto unboard both ways
    currentProfile.boards.pull(targetUserId);
    if (targetProfile) {
      targetProfile.boards.pull(currentUserId);
      await targetProfile.save();
    }

    await currentProfile.save();

    return res.status(200).json({
      message: "User successfully blocked",
      blockedUserId: targetUserId,
    });
  } catch (error) {
    console.error("blockUser error:", error);
    return res.status(500).json({ message: "Failed to block user", error: error.message });
  }
}

/**
 * POST /api/safety/unblock/:id
 * Unblock a user
 */
export async function unblockUser(req, res) {
  try {
    const currentUserId = req.user.id;
    const targetUserId = req.params.id;

    const currentProfile = await profileModel.findOne({ user: currentUserId });
    if (!currentProfile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    if (currentProfile.blockedUsers) {
      currentProfile.blockedUsers.pull(targetUserId);
      await currentProfile.save();
    }

    return res.status(200).json({
      message: "User successfully unblocked",
      unblockedUserId: targetUserId,
    });
  } catch (error) {
    console.error("unblockUser error:", error);
    return res.status(500).json({ message: "Failed to unblock user", error: error.message });
  }
}
