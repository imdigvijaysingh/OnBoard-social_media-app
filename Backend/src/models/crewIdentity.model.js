import mongoose from "mongoose";

const crewIdentitySchema = new mongoose.Schema(
  {
    crewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    displayName: {
      type: String,
      trim: true,
      default: "",
    },
    badge: {
      type: String,
      trim: true,
      default: "",
    },
    avatar: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

crewIdentitySchema.index({ crewId: 1, user: 1 }, { unique: true });

const crewIdentityModel = mongoose.model("crew_identities", crewIdentitySchema);

export default crewIdentityModel;
