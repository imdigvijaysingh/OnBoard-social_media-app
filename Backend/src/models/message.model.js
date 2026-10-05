import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
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
    clientMessageId: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        "text",
        "image",
        "video",
        "voice",
        "file",
        "poll",
        "system",
        "celebration",
        "activity",
        "location",
        "live_location",
        "widget",
        "experience",
        "moment",
        "meeting_point",
        "checklist",
        "question",
      ],
      default: "text",
    },
    locationShare: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "location_shares",
      default: null,
    },
    locationData: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
      accuracy: { type: Number, default: null },
      label: { type: String, default: "" },
    },
    widget: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "widgets",
      default: null,
    },
    experience: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "experiences",
      default: null,
    },
    moment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "moments",
      default: null,
    },
    text: {
      type: String,
      default: "",
      trim: true,
    },
    mediaUrl: {
      type: String,
      default: "",
    },
    mediaType: {
      type: String,
      default: "",
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "messages",
      default: null,
    },
    replyPreview: {
      messageId: { type: mongoose.Schema.Types.ObjectId, ref: "messages" },
      senderName: { type: String, default: "" },
      textPreview: { type: String, default: "" },
      mediaType: { type: String, default: "" },
    },
    celebrationType: {
      type: String,
      default: null,
    },
    reactions: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "users",
        },
        emoji: {
          type: String,
        },
      },
    ],
    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
      },
    ],
    isDeletedForEveryone: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ conversation: 1, sender: 1 });
messageSchema.index({ conversation: 1, type: 1, createdAt: -1 });
messageSchema.index({ text: "text" });
messageSchema.index({ clientMessageId: 1 }, { unique: true, sparse: true });

const messageModel = mongoose.model("messages", messageSchema);

export default messageModel;
