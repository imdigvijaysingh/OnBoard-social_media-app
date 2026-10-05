import mongoose from "mongoose";

const locationShareRecipientSchema = new mongoose.Schema(
  {
    locationShare: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "location_shares",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    permission: {
      type: String,
      enum: ["view"],
      default: "view",
    },
    viewedAt: {
      type: Date,
      default: null,
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

locationShareRecipientSchema.index(
  { locationShare: 1, user: 1 },
  { unique: true }
);
locationShareRecipientSchema.index({ user: 1 });

const locationShareRecipientModel = mongoose.model(
  "location_share_recipients",
  locationShareRecipientSchema
);

export default locationShareRecipientModel;
