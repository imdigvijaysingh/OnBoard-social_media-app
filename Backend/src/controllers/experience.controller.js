import crypto from "crypto";
import experienceModel from "../models/experience.model.js";
import messageModel from "../models/message.model.js";
import conversationMemberModel from "../models/conversationMember.model.js";
import profileModel from "../models/profile.model.js";

async function verifyMembership(conversationId, userId) {
  const member = await conversationMemberModel.findOne({
    conversation: conversationId,
    user: userId,
  });
  return !!member;
}

/**
 * 1. Create a structured Experience
 */
export async function createExperience(req, res) {
  try {
    const userId = req.user.id;
    const {
      conversationId,
      title,
      category = "hangout",
      date,
      locationName,
      latitude,
      longitude,
      description,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Experience title is required" });
    }

    const isMember = await verifyMembership(conversationId, userId);
    if (!isMember) {
      return res.status(403).json({ message: "Forbidden: Not a member of this conversation" });
    }

    const experience = await experienceModel.create({
      conversation: conversationId,
      creator: userId,
      title: title.trim(),
      category,
      date: date ? new Date(date) : null,
      locationName: locationName ? locationName.trim() : "",
      locationCoordinates: {
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
      },
      description: description ? description.trim() : "",
      rsvps: [{ user: userId, status: "going", updatedAt: new Date() }],
    });

    const clientMessageId = crypto.randomUUID();
    const categoryEmojis = {
      trip: "🌴",
      event: "🎉",
      celebration: "🎂",
      project: "🎓",
      gaming: "🎮",
      hangout: "🍜",
      watch: "🎬",
      activity: "🏃",
      custom: "✨",
    };
    const emoji = categoryEmojis[category] || "✨";

    const message = await messageModel.create({
      conversation: conversationId,
      sender: userId,
      clientMessageId,
      type: "experience",
      experience: experience._id,
      text: `${emoji} Experience: ${title.trim()}`,
      locationData: {
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        label: locationName ? locationName.trim() : "",
      },
    });

    experience.message = message._id;
    await experience.save();

    return res.status(201).json({ experience, message });
  } catch (err) {
    console.error("Error creating experience:", err);
    return res.status(500).json({ message: "Failed to create experience" });
  }
}

/**
 * 2. Update RSVP status (going, maybe, cant_go)
 */
export async function updateRsvp(req, res) {
  try {
    const userId = req.user.id;
    const { experienceId } = req.params;
    const { status } = req.body;

    if (!["going", "maybe", "cant_go"].includes(status)) {
      return res.status(400).json({ message: "Invalid RSVP status" });
    }

    const experience = await experienceModel.findById(experienceId);
    if (!experience) {
      return res.status(404).json({ message: "Experience not found" });
    }

    const isMember = await verifyMembership(experience.conversation, userId);
    if (!isMember) {
      return res.status(403).json({ message: "Forbidden: Not a member of this conversation" });
    }

    const existingIndex = experience.rsvps.findIndex(
      (r) => r.user?.toString() === userId.toString()
    );

    if (existingIndex > -1) {
      experience.rsvps[existingIndex].status = status;
      experience.rsvps[existingIndex].updatedAt = new Date();
    } else {
      experience.rsvps.push({ user: userId, status, updatedAt: new Date() });
    }

    experience.markModified("rsvps");
    await experience.save();

    return res.status(200).json({ experience });
  } catch (err) {
    console.error("Error updating RSVP:", err);
    return res.status(500).json({ message: "Failed to update RSVP" });
  }
}

/**
 * 3. Fetch conversation experiences
 */
export async function getConversationExperiences(req, res) {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;

    const isMember = await verifyMembership(conversationId, userId);
    if (!isMember) {
      return res.status(403).json({ message: "Forbidden: Not a member of this conversation" });
    }

    const experiences = await experienceModel
      .find({ conversation: conversationId })
      .sort({ createdAt: -1 })
      .populate("creator", "firstName lastName")
      .populate("rsvps.user", "firstName lastName")
      .lean();

    return res.status(200).json({ experiences });
  } catch (err) {
    console.error("Error fetching experiences:", err);
    return res.status(500).json({ message: "Failed to fetch experiences" });
  }
}

/**
 * 4. Save Experience to Board
 */
export async function saveExperienceToBoard(req, res) {
  try {
    const userId = req.user.id;
    const { experienceId } = req.params;

    const experience = await experienceModel.findById(experienceId);
    if (!experience) {
      return res.status(404).json({ message: "Experience not found" });
    }

    const isMember = await verifyMembership(experience.conversation, userId);
    if (!isMember) {
      return res.status(403).json({ message: "Forbidden: Not a member of this conversation" });
    }

    experience.exportedToBoard = true;
    await experience.save();

    return res.status(200).json({
      message: "Experience saved to your Board memories",
      experience,
    });
  } catch (err) {
    console.error("Error saving experience to board:", err);
    return res.status(500).json({ message: "Failed to save experience" });
  }
}
