import mongoose from "mongoose";

const chapterMessageSchema = new mongoose.Schema(
  {
    chapter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "chapters",
      required: true,
    },
    message: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "messages",
      required: true,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

chapterMessageSchema.index({ chapter: 1, message: 1 }, { unique: true });
chapterMessageSchema.index({ message: 1 });
chapterMessageSchema.index({ chapter: 1, createdAt: 1 });

const chapterMessageModel = mongoose.model(
  "chapter_messages",
  chapterMessageSchema
);

export default chapterMessageModel;
