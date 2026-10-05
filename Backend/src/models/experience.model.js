import mongoose from "mongoose";

const experienceSchema = new mongoose.Schema(
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
        "trip",
        "event",
        "celebration",
        "project",
        "gaming",
        "hangout",
        "watch",
        "activity",
        "custom",
      ],
      default: "hangout",
    },
    date: {
      type: Date,
      default: null,
    },
    locationName: {
      type: String,
      default: "",
      trim: true,
    },
    locationCoordinates: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    rsvps: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "users",
          required: true,
        },
        status: {
          type: String,
          enum: ["going", "maybe", "cant_go"],
          default: "going",
        },
        updatedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    checklist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "widgets",
      default: null,
    },
    meetingPoint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "widgets",
      default: null,
    },
    status: {
      type: String,
      enum: ["planning", "active", "completed", "archived"],
      default: "planning",
    },
    exportedToBoard: {
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

experienceSchema.index({ conversation: 1, createdAt: -1 });
experienceSchema.index({ creator: 1 });

const experienceModel = mongoose.model("experiences", experienceSchema);

export default experienceModel;
