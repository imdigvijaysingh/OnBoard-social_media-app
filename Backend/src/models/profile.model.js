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
    bio: {
      type: String,
      default: "Hi there! ✨ Content Creator based in the digital world 📍 Explore my posts!",
    },
    dob: {
      type: String,
    },
    gender: {
      type: String,
      default: "",
    },
    pronouns: {
      type: String,
      default: "",
    },
    contactEmail: {
      type: String,
      default: "",
    },
    showEmail: {
      type: Boolean,
      default: false,
    },
    contactPhone: {
      type: String,
      default: "",
    },
    showPhone: {
      type: Boolean,
      default: false,
    },
    photoHistory: [
      {
        url: {
          type: String,
          required: true,
        },
        startedAt: {
          type: Date,
          default: Date.now,
        },
        endedAt: {
          type: Date,
          default: null, // null indicates this is the currently active photo
        },
      },
    ],
    isPrivate: {
      type: Boolean,
      default: false,
    },
    boards: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
      },
    ],
    boardRequests: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "users",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        }
      },
    ],
    savedPosts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "post",
      },
    ],
    membershipTier: {
      type: String,
      enum: ["standard", "creator_pro", "gold_vip", "diamond"],
      default: "standard",
    },
    cabinTheme: {
      type: String,
      default: "default",
    },
    vipFlair: {
      type: String,
      default: "",
    },
    communityStanding: {
      type: String,
      enum: ["good_standing", "under_review", "restricted"],
      default: "good_standing",
    },
    trustScore: {
      type: Number,
      default: 100,
    },
    safetyBadges: {
      type: [String],
      default: ["Verified Crew", "Anti-Spam Guardian", "Clean Record"],
    },
    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
      },
    ],
    isOfficialVerified: {
      type: Boolean,
      default: false,
    },
    officialVerifiedAt: {
      type: Date,
      default: null,
    },
    interests: {
      type: [String],
      default: ["tech", "comedy", "travel", "music", "fitness"],
    },
    interestScores: {
      type: Map,
      of: Number,
      default: () => ({ tech: 10, comedy: 10, travel: 8, music: 6, fitness: 5 }),
    },
  },
  {
    timestamps: true,
  },
);

const profileModel = mongoose.model("profile", profileSchema);

export default profileModel;
