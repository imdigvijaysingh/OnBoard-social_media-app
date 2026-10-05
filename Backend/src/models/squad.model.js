import mongoose from "mongoose";

const squadMemberSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  role: {
    type: String,
    enum: ["captain", "co_captain", "crew"],
    default: "crew",
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
  },
});

const squadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    handle: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    tagline: {
      type: String,
      default: "",
      maxlength: 140,
    },
    description: {
      type: String,
      default: "",
      maxlength: 1500,
    },
    avatar: {
      type: String,
      default: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=200&auto=format&fit=crop&q=80",
    },
    banner: {
      type: String,
      default: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&auto=format&fit=crop&q=80",
    },
    captain: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    members: [squadMemberSchema],
    categoryTags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    privacy: {
      type: String,
      enum: ["public", "invite_only"],
      default: "public",
    },
    settings: {
      whoCanChat: {
        type: String,
        enum: ["all_members", "captains_only"],
        default: "all_members",
      },
      whoCanInvite: {
        type: String,
        enum: ["all_members", "captains_only"],
        default: "all_members",
      },
    },
  },
  { timestamps: true }
);

export const squadModel = mongoose.model("squad", squadSchema);
export default squadModel;
