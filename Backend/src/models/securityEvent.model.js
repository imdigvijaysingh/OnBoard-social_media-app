import mongoose from "mongoose";

const securityEventSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "sessions",
    },
    eventType: {
      type: String,
      enum: [
        "LOGIN_SUCCESS",
        "LOGIN_FAILED",
        "LOGIN_FAILED_THRESHOLD",
        "LOGIN_NEW_DEVICE",
        "PASSWORD_CHANGED",
        "SESSION_REVOKED",
        "SECURITY_WARNING",
      ],
      required: true,
    },
    device: {
      type: String,
      default: "Unknown Device",
    },
    browser: {
      type: String,
      default: "Unknown Browser",
    },
    os: {
      type: String,
      default: "Unknown OS",
    },
    ip: {
      type: String,
      default: "127.0.0.1",
    },
    approximateLocation: {
      type: String,
      default: "Local Network",
    },
    status: {
      type: String,
      enum: ["active", "revoked", "acknowledged"],
      default: "active",
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast chronological audit retrieval per user
securityEventSchema.index({ user: 1, timestamp: -1 });

// Note: No TTL index here. Security audit records are permanently retained
// and are never deleted by notification expiration cleanup.

const securityEventModel = mongoose.model("securityEvents", securityEventSchema);

export default securityEventModel;
