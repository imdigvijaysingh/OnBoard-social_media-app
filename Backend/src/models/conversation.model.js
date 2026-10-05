import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["direct", "group", "crew"],
      default: "direct",
      required: true,
    },
    title: {
      type: String,
      trim: true,
      default: "",
    },
    avatar: {
      type: String,
      default: "",
    },
    lastMessage: {
      text: { type: String, default: "" },
      sender: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
      messageType: { type: String, default: "text" },
      timestamp: { type: Date, default: Date.now },
    },
    settings: {
      atmosphere: {
        type: String,
        enum: ["default", "night", "celebration", "gaming", "travel", "study"],
        default: "default",
      },
      allowMemberInvites: {
        type: Boolean,
        default: true,
      },
    },
    pinnedMessages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "messages",
      },
    ],
  },
  {
    timestamps: true,
  }
);

conversationSchema.index({ updatedAt: -1 });

const conversationModel = mongoose.model("conversations", conversationSchema);

export default conversationModel;
