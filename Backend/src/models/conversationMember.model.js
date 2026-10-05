import mongoose from "mongoose";

const conversationMemberSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "conversations",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "moderator", "member"],
      default: "member",
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    lastReadMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "messages",
      default: null,
    },
    lastReadAt: {
      type: Date,
      default: Date.now,
    },
    mutedUntil: {
      type: Date,
      default: null,
    },
    settings: {
      notificationLevel: {
        type: String,
        enum: ["all", "mentions", "none"],
        default: "all",
      },
    },
  },
  {
    timestamps: true,
  }
);

conversationMemberSchema.index({ conversation: 1, user: 1 }, { unique: true });
conversationMemberSchema.index({ user: 1, lastReadAt: -1 });

const conversationMemberModel = mongoose.model(
  "conversation_members",
  conversationMemberSchema
);

export default conversationMemberModel;
