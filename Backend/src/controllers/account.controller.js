import bcrypt from 'bcryptjs';
import userModel from '../models/user.model.js';
import profileModel from '../models/profile.model.js';
import { postModel } from '../models/post.model.js';
import sessionModel from '../models/session.model.js';
import securityEventModel from '../models/securityEvent.model.js';
import notificationModel from '../models/notification.model.js';
import conversationMemberModel from '../models/conversationMember.model.js';
import reportModel from '../models/report.model.js';
import { recordSecurityEvent, createNotification } from '../services/notification.service.js';

/**
 * PUT /api/account/email
 * Update primary login email address
 */
export async function updateEmail(req, res) {
  try {
    const userId = req.user.id;
    const { newEmail, currentPassword } = req.body;

    if (!newEmail || !newEmail.trim()) {
      return res.status(400).json({ message: "New email address is required" });
    }

    if (!currentPassword) {
      return res.status(400).json({ message: "Current password is required to verify identity" });
    }

    const cleanEmail = newEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ message: "Invalid email address format" });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User account not found" });
    }

    if (user.email.toLowerCase() === cleanEmail) {
      return res.status(400).json({ message: "New email is identical to current email" });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Incorrect password. Email update rejected." });
    }

    // Check if new email is taken
    const existing = await userModel.findOne({ email: cleanEmail, _id: { $ne: userId } });
    if (existing) {
      return res.status(409).json({ message: "This email address is already associated with another account." });
    }

    const oldEmail = user.email;
    user.email = cleanEmail;
    await user.save();

    // Also update contactEmail in profile if it was using old email
    const profile = await profileModel.findOne({ user: userId });
    if (profile && (!profile.contactEmail || profile.contactEmail === oldEmail)) {
      profile.contactEmail = cleanEmail;
      await profile.save();
    }

    // Record security event
    await recordSecurityEvent({
      userId,
      eventType: "SECURITY_WARNING",
      ip: req.ip || "127.0.0.1",
      device: req.headers["user-agent"]?.includes("Mobile") ? "Mobile Device" : "Desktop Device",
      browser: req.headers["user-agent"]?.includes("Chrome") ? "Chrome" : "Browser",
      os: req.headers["user-agent"]?.includes("Windows") ? "Windows" : "OS",
      approximateLocation: "Account Settings Control",
      notifyUser: true,
      metadata: { action: "PRIMARY_EMAIL_CHANGED", oldEmail, newEmail: cleanEmail },
    }).catch(e => console.error("Sec log error:", e));

    // Create confirmation notification
    await createNotification({
      recipient: userId,
      actor: userId,
      type: "SECURITY_ALERT",
      category: "system",
      priority: "high",
      title: "🛡️ Primary Email Updated",
      body: `Your primary account login email was updated to ${cleanEmail}.`,
      entityType: "user",
      entityId: userId,
      deepLink: "/my-profile",
    }).catch(e => console.error("Notif error:", e));

    return res.status(200).json({
      message: "Primary login email successfully updated.",
      email: user.email,
    });
  } catch (error) {
    console.error("updateEmail error:", error);
    return res.status(500).json({ message: "Failed to update email address", error: error.message });
  }
}

/**
 * PUT /api/account/password
 * Change account password
 */
export async function changePassword(req, res) {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Both current password and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters long" });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User account not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password does not match" });
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({ message: "New password must be different from current password" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    // Record security event
    await recordSecurityEvent({
      userId,
      eventType: "PASSWORD_CHANGED",
      ip: req.ip || "127.0.0.1",
      device: req.headers["user-agent"]?.includes("Mobile") ? "Mobile Device" : "Desktop Device",
      browser: req.headers["user-agent"]?.includes("Chrome") ? "Chrome" : "Browser",
      os: req.headers["user-agent"]?.includes("Windows") ? "Windows" : "OS",
      approximateLocation: "Account Settings Control",
      notifyUser: true,
    }).catch(e => console.error("Sec log error:", e));

    // Create confirmation notification
    await createNotification({
      recipient: userId,
      actor: userId,
      type: "SECURITY_ALERT",
      category: "system",
      priority: "high",
      title: "🔑 Password Changed",
      body: "Your account password was successfully changed. If this wasn't you, revoke sessions immediately.",
      entityType: "user",
      entityId: userId,
      deepLink: "/my-profile",
    }).catch(e => console.error("Notif error:", e));

    return res.status(200).json({
      message: "Password changed successfully.",
    });
  } catch (error) {
    console.error("changePassword error:", error);
    return res.status(500).json({ message: "Failed to change password", error: error.message });
  }
}

/**
 * DELETE /api/account/delete
 * Permanently delete user account and cascade clean all cabin data
 */
export async function deleteAccount(req, res) {
  try {
    const userId = req.user.id;
    const { confirmation, password } = req.body;

    if (!confirmation || confirmation.trim().toUpperCase() !== "DELETE") {
      return res.status(400).json({
        message: "You must type 'DELETE' exactly to confirm account deletion.",
      });
    }

    if (!password) {
      return res.status(400).json({ message: "Account password is required to authorize deletion." });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User account not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Incorrect password. Account deletion aborted." });
    }

    console.log(`[Account Delete] Initiating cascade deletion for user ${userId} (${user.email})`);

    // 1. Delete all posts created by user
    await postModel.deleteMany({ user: userId });

    // 2. Remove user from likes, shares, bookmarks, and comments on other posts
    await postModel.updateMany(
      {},
      {
        $pull: {
          likes: userId,
          shares: userId,
          bookmarks: userId,
          comments: { user: userId },
        },
      }
    );

    // 3. Remove user from all profiles' boards and boardRequests
    await profileModel.updateMany(
      {},
      {
        $pull: {
          boards: userId,
          boardRequests: { user: userId },
          blockedUsers: userId,
        },
      }
    );

    // 4. Delete user's profile
    await profileModel.deleteOne({ user: userId });

    // 5. Delete notifications
    await notificationModel.deleteMany({
      $or: [{ recipient: userId }, { actor: userId }],
    });

    // 6. Delete sessions and security events
    await sessionModel.deleteMany({ user: userId });
    await securityEventModel.deleteMany({ user: userId });

    // 7. Delete conversation memberships
    await conversationMemberModel.deleteMany({ user: userId });

    // 8. Delete reports filed by user
    await reportModel.deleteMany({ reporter: userId });

    // 9. Delete user account document
    await userModel.findByIdAndDelete(userId);

    // 10. Clear cookies
    res.clearCookie("token");
    res.clearCookie("refreshToken");
    res.clearCookie("accessToken");

    return res.status(200).json({
      message: "Account and all associated cabin data have been permanently deleted.",
    });
  } catch (error) {
    console.error("deleteAccount error:", error);
    return res.status(500).json({ message: "Failed to delete account", error: error.message });
  }
}
