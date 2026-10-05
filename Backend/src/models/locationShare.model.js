import mongoose from "mongoose";

const locationShareSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "conversations",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    message: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "messages",
      default: null,
    },
    type: {
      type: String,
      enum: ["current", "live"],
      required: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    durationMinutes: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "stopped", "expired"],
      default: "active",
    },
    latestLatitude: {
      type: Number,
      required: true,
    },
    latestLongitude: {
      type: Number,
      required: true,
    },
    latestAccuracy: {
      type: Number,
      default: null,
    },
    latestUpdatedAt: {
      type: Date,
      default: Date.now,
    },
    precision: {
      type: String,
      enum: ["exact", "approximate"],
      default: "exact",
    },
    visibility: {
      type: String,
      enum: ["conversation_members", "selected_members", "private"],
      default: "conversation_members",
    },
    notifyRecipients: {
      type: Boolean,
      default: false,
    },
    label: {
      type: String,
      trim: true,
      default: "",
    },
    savedToBoard: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

locationShareSchema.index({ sender: 1, status: 1 });
locationShareSchema.index({ conversation: 1, status: 1 });
locationShareSchema.index({ expiresAt: 1, status: 1 });

const locationShareModel = mongoose.model(
  "location_shares",
  locationShareSchema
);

export default locationShareModel;
