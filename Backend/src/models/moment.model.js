import mongoose from "mongoose";

const momentSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "conversations",
      required: true,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: [
        "first_conversation",
        "funny",
        "announcement",
        "trip_planning",
        "birthday",
        "achievement",
        "inside_joke",
        "custom",
      ],
      default: "funny",
    },
    coverImage: {
      type: String,
      default: "",
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
    messages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "messages",
      },
    ],
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
      },
    ],
    exportedToMemory: {
      type: Boolean,
      default: false,
    },
    message: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "messages",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

momentSchema.index({ conversation: 1, createdAt: -1 });
momentSchema.index({ creator: 1 });

const momentModel = mongoose.model("moments", momentSchema);

export default momentModel;
