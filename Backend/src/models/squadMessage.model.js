import mongoose from "mongoose";

const squadMessageSchema = new mongoose.Schema(
  {
    squad: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "squad",
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    text: {
      type: String,
      trim: true,
      default: "",
    },
    mediaUrl: {
      type: String,
      default: "",
    },
    mediaType: {
      type: String,
      enum: ["none", "image", "video"],
      default: "none",
    },
    pinned: {
      type: Boolean,
      default: false,
    },
    reactions: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "users",
        },
        emoji: {
          type: String,
          default: "👍",
        },
      },
    ],
  },
  { timestamps: true }
);

export const squadMessageModel = mongoose.model(
  "squad_message",
  squadMessageSchema
);

export default squadMessageModel;
