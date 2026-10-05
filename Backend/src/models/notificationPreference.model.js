import mongoose from "mongoose";

const notificationPreferenceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      unique: true,
      index: true,
    },
    messages: {
      direct: { type: Boolean, default: true },
      mentions: { type: Boolean, default: true },
      replies: { type: Boolean, default: true },
      reactions: { type: Boolean, default: true },
    },
    social: {
      likes: { type: Boolean, default: true },
      comments: { type: Boolean, default: true },
      mentions: { type: Boolean, default: true },
    },
    crews: {
      boardingRequests: { type: Boolean, default: true },
      invitations: { type: Boolean, default: true },
      roleChanges: { type: Boolean, default: true },
      announcements: { type: Boolean, default: true },
    },
    location: {
      current: { type: Boolean, default: true },
      live: { type: Boolean, default: true },
      expiration: { type: Boolean, default: true },
    },
    activity: {
      experiences: { type: Boolean, default: true },
      polls: { type: Boolean, default: true },
      checklists: { type: Boolean, default: true },
      memories: { type: Boolean, default: true },
      boards: { type: Boolean, default: true },
      lounges: { type: Boolean, default: true },
    },
    security: {
      // Security-critical notifications are enforced true by business logic
      newLogin: { type: Boolean, default: true },
      passwordChanged: { type: Boolean, default: true },
      sessionRevoked: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  }
);

const notificationPreferenceModel = mongoose.model(
  "notificationPreferences",
  notificationPreferenceSchema
);

export default notificationPreferenceModel;
