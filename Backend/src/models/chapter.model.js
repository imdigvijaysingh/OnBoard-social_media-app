import mongoose from "mongoose";

const chapterSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    profile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "profile",
    },
    title: {
      type: String,
      required: [true, "Chapter title is required"],
      trim: true,
    },
    emoji: {
      type: String,
      default: "📖",
      trim: true,
    },
    timeframe: {
      type: String,
      default: "",
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    coverImage: {
      type: String,
      default: "",
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    posts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "post",
      },
    ],
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "conversations",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

chapterSchema.index({ user: 1, createdAt: -1 });
chapterSchema.index({ profile: 1 });

const chapterModel = mongoose.model("chapters", chapterSchema);

export default chapterModel;
