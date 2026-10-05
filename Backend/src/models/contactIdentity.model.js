import mongoose from "mongoose";

const contactIdentitySchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    privateNickname: {
      type: String,
      trim: true,
      default: "",
    },
    privateAvatar: {
      type: String,
      default: "",
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

contactIdentitySchema.index({ owner: 1, targetUser: 1 }, { unique: true });

const contactIdentityModel = mongoose.model(
  "contact_identities",
  contactIdentitySchema
);

export default contactIdentityModel;
