import mongoose from "mongoose";

const profileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    profilePhoto: {
      type: String,
    },
    userName: {
      type: String,
      required: true,
      unique: true,
    },
    dob: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

const profileModel = mongoose.model("profile", profileSchema);

export default profileModel;
