import mongoose from "mongoose";

const widgetSchema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: ["poll", "checklist", "meeting_point", "question"],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "completed", "cancelled", "closed"],
      default: "active",
    },
    // Poll specific configuration & votes
    pollData: {
      isMultiChoice: { type: Boolean, default: false },
      isAnonymous: { type: Boolean, default: false },
      closedAt: { type: Date, default: null },
      options: [
        {
          id: { type: String, required: true },
          text: { type: String, required: true, trim: true },
          votes: [
            {
              user: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
              votedAt: { type: Date, default: Date.now },
            },
          ],
        },
      ],
    },
    // Checklist specific items
    checklistData: {
      items: [
        {
          id: { type: String, required: true },
          text: { type: String, required: true, trim: true },
          completed: { type: Boolean, default: false },
          completedBy: { type: mongoose.Schema.Types.ObjectId, ref: "users", default: null },
          completedAt: { type: Date, default: null },
          assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "users", default: null },
        },
      ],
    },
    // Meeting Point specific coordinates and arrivals
    meetingPointData: {
      venueName: { type: String, default: "", trim: true },
      scheduledTime: { type: Date, default: null },
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
      accuracy: { type: Number, default: null },
      attendeesHere: [
        {
          user: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
          checkedInAt: { type: Date, default: Date.now },
        },
      ],
    },
    // Social Question prompt & answers
    questionData: {
      prompt: { type: String, default: "", trim: true },
      answers: [
        {
          user: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
          text: { type: String, required: true, trim: true },
          createdAt: { type: Date, default: Date.now },
        },
      ],
    },
    // Associated chat message
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

widgetSchema.index({ conversation: 1, type: 1, createdAt: -1 });
widgetSchema.index({ creator: 1 });

const widgetModel = mongoose.model("widgets", widgetSchema);

export default widgetModel;
