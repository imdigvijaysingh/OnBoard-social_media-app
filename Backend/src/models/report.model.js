import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      enum: ["post", "user", "message"],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    reason: {
      type: String,
      enum: [
        "spam",
        "harassment",
        "inappropriate_media",
        "hate_speech",
        "impersonation",
        "other",
      ],
      required: true,
    },
    details: {
      type: String,
      default: "",
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "dismissed", "action_taken"],
      default: "pending",
      index: true,
    },
    adminNotes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

reportSchema.index({ targetType: 1, targetId: 1 });

const reportModel = mongoose.model("reports", reportSchema);

export default reportModel;
