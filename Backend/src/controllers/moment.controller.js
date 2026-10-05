import crypto from "crypto";
import momentModel from "../models/moment.model.js";
import messageModel from "../models/message.model.js";
import conversationMemberModel from "../models/conversationMember.model.js";

async function verifyMembership(conversationId, userId) {
  const member = await conversationMemberModel.findOne({
    conversation: conversationId,
    user: userId,
  });
  return !!member;
}

/**
 * 1. Create a Moment from selected messages
 */
export async function createMoment(req, res) {
  try {
    const userId = req.user.id;
    const {
      conversationId,
      title,
      category = "funny",
      coverImage = "",
      notes = "",
      messageIds = [],
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Moment title is required" });
    }

    const isMember = await verifyMembership(conversationId, userId);
    if (!isMember) {
      return res.status(403).json({ message: "Forbidden: Not a member of this conversation" });
    }

    const moment = await momentModel.create({
      conversation: conversationId,
      creator: userId,
      title: title.trim(),
      category,
      coverImage,
      notes: notes.trim(),
      messages: messageIds,
      participants: [userId],
    });

    const clientMessageId = crypto.randomUUID();
    const categoryEmojis = {
      first_conversation: "🌱",
      funny: "😂",
      announcement: "📢",
      trip_planning: "🗺️",
      birthday: "🎂",
      achievement: "🏆",
      inside_joke: "🤫",
      custom: "✨",
    };
    const emoji = categoryEmojis[category] || "✨";

    const message = await messageModel.create({
      conversation: conversationId,
      sender: userId,
      clientMessageId,
      type: "moment",
      moment: moment._id,
      text: `${emoji} Moment: ${title.trim()}`,
    });

    moment.message = message._id;
    await moment.save();

    return res.status(201).json({ moment, message });
  } catch (err) {
    console.error("Error creating moment:", err);
    return res.status(500).json({ message: "Failed to create moment" });
  }
}

/**
 * 2. Fetch moments for a conversation
 */
export async function getConversationMoments(req, res) {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;

    const isMember = await verifyMembership(conversationId, userId);
    if (!isMember) {
      return res.status(403).json({ message: "Forbidden: Not a member of this conversation" });
    }

    const moments = await momentModel
      .find({ conversation: conversationId })
      .sort({ createdAt: -1 })
      .populate("creator", "firstName lastName")
      .populate("messages", "text mediaUrl type createdAt")
      .lean();

    return res.status(200).json({ moments });
  } catch (err) {
    console.error("Error fetching moments:", err);
    return res.status(500).json({ message: "Failed to fetch moments" });
  }
}

/**
 * 3. Export Moment to Memory
 */
export async function exportMomentToMemory(req, res) {
  try {
    const userId = req.user.id;
    const { momentId } = req.params;

    const moment = await momentModel.findById(momentId);
    if (!moment) {
      return res.status(404).json({ message: "Moment not found" });
    }

    const isMember = await verifyMembership(moment.conversation, userId);
    if (!isMember) {
      return res.status(403).json({ message: "Forbidden: Not a member of this conversation" });
    }

    moment.exportedToMemory = true;
    await moment.save();

    return res.status(200).json({
      message: "Moment successfully preserved in your Board Memories",
      moment,
    });
  } catch (err) {
    console.error("Error exporting moment:", err);
    return res.status(500).json({ message: "Failed to export moment" });
  }
}
