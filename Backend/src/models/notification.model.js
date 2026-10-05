import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      default: null,
    },
    // Bounded representative actors array for grouped notifications (up to 10)
    actors: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
        name: { type: String, default: "" },
        avatar: { type: String, default: "" },
        actionTime: { type: Date, default: Date.now },
      },
    ],
    type: {
      type: String,
      enum: [
        // Social
        "LIKE",
        "REACTION",
        "COMMENT",
        "MENTION",
        // Crews
        "BOARDING_REQUEST",
        "BOARDING_ACCEPTED",
        "CREW_INVITE",
        "CREW_ROLE",
        "CREW_ANNOUNCEMENT",
        "CREW_BIRTHDAY",
        // Chats
        "MESSAGE",
        "REPLY",
        "CHAPTER_CREATED",
        "MOMENT_CREATED",
        // Activity & Outings
        "EXPERIENCE_INVITE",
        "RSVP_CHANGED",
        "POLL_CREATED",
        "CHECKLIST_UPDATE",
        "MEMORY_CREATED",
        // Boards & Lounges
        "BOARD_INVITE",
        "BOARD_COLLABORATOR_ADDED",
        "BOARD_UPDATED",
        "BOARD_COMMENT",
        "LOUNGE_INVITE",
        "LOUNGE_JOINED",
        "LOUNGE_UPDATED",
        "LOUNGE_ACTIVITY",
        // Locations
        "LOCATION_SHARED",
        "LIVE_LOCATION_STARTED",
        "LIVE_LOCATION_STOPPED",
        // Security
        "LOGIN_NEW_DEVICE",
        "PASSWORD_CHANGED",
        "SECURITY_WARNING",
        "LOGIN_FAILED_THRESHOLD",
        // System
        "SYSTEM",
      ],
      required: true,
    },
    category: {
      type: String,
      enum: ["social", "crews", "chats", "activity", "security", "system"],
      default: "social",
      index: true,
    },
    priority: {
      type: String,
      enum: ["critical", "high", "normal", "low"],
      default: "normal",
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
    },
    entityType: {
      type: String,
      enum: [
        "post",
        "comment",
        "conversation",
        "message",
        "chapter",
        "moment",
        "experience",
        "locationShare",
        "securityEvent",
        "board",
        "lounge",
        "user",
        "system",
      ],
      default: "system",
    },
    entityId: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    deepLink: {
      type: String,
      default: "/notifications",
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // Idempotency key scoped per recipient
    sourceEventId: {
      type: String,
      default: null,
    },
    // Collapsing key for grouped notifications (e.g. `like_post_12345`)
    groupKey: {
      type: String,
      default: null,
      index: true,
    },
    groupCount: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: ["unread", "read", "actioned", "archived"],
      default: "unread",
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
    actionType: {
      type: String,
      enum: [
        "accept_decline_board",
        "experience_rsvp",
        "board_invite",
        "view_location",
        "open_chat",
        "open_profile",
        "wish_birthday",
        "review_security",
        "none",
      ],
      default: "none",
    },
    actionedAt: {
      type: Date,
      default: null,
    },
    actionResult: {
      type: String,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // Default 60 days
    },
  },
  {
    timestamps: true,
  }
);

// Compound Unique Idempotency Index (enforced only when sourceEventId is a string)
notificationSchema.index(
  { recipient: 1, sourceEventId: 1 },
  {
    unique: true,
    partialFilterExpression: { sourceEventId: { $type: "string" } },
  }
);

// Query Performance Indexes
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, status: 1 });
notificationSchema.index({ recipient: 1, category: 1, createdAt: -1 });
notificationSchema.index({ groupKey: 1, status: 1 });

// Automatic MongoDB TTL index for routine notification retention
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const notificationModel = mongoose.model("notifications", notificationSchema);

export default notificationModel;
