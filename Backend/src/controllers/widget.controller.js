import crypto from "crypto";
import widgetModel from "../models/widget.model.js";
import messageModel from "../models/message.model.js";
import conversationMemberModel from "../models/conversationMember.model.js";

/**
 * Helper to verify conversation membership
 */
async function verifyMembership(conversationId, userId) {
  const member = await conversationMemberModel.findOne({
    conversation: conversationId,
    user: userId,
  });
  return !!member;
}

/**
 * 1. Create a native Poll
 */
export async function createPoll(req, res) {
  try {
    const userId = req.user.id;
    const { conversationId, title, options, isMultiChoice, isAnonymous, closingInHours } = req.body;

    if (!title || !options || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ message: "Poll requires a title and at least 2 options" });
    }

    const isMember = await verifyMembership(conversationId, userId);
    if (!isMember) {
      return res.status(403).json({ message: "Forbidden: You are not a member of this conversation" });
    }

    const pollOptions = options.map((optText) => ({
      id: crypto.randomUUID(),
      text: optText.trim(),
      votes: [],
    }));

    let closedAt = null;
    if (closingInHours && closingInHours > 0) {
      closedAt = new Date(Date.now() + closingInHours * 60 * 60 * 1000);
    }

    const widget = await widgetModel.create({
      conversation: conversationId,
      creator: userId,
      type: "poll",
      title: title.trim(),
      pollData: {
        isMultiChoice: !!isMultiChoice,
        isAnonymous: !!isAnonymous,
        closedAt,
        options: pollOptions,
      },
    });

    // Create corresponding message in conversation
    const clientMessageId = crypto.randomUUID();
    const message = await messageModel.create({
      conversation: conversationId,
      sender: userId,
      clientMessageId,
      type: "widget",
      widget: widget._id,
      text: `📊 Poll: ${title.trim()}`,
    });

    widget.message = message._id;
    await widget.save();

    return res.status(201).json({ widget, message });
  } catch (err) {
    console.error("Error creating poll:", err);
    return res.status(500).json({ message: "Failed to create poll" });
  }
}

/**
 * 2. Vote on a Poll option
 */
export async function votePoll(req, res) {
  try {
    const userId = req.user.id;
    const { widgetId } = req.params;
    const { optionId } = req.body;

    const widget = await widgetModel.findById(widgetId);
    if (!widget || widget.type !== "poll") {
      return res.status(404).json({ message: "Poll not found" });
    }

    const isMember = await verifyMembership(widget.conversation, userId);
    if (!isMember) {
      return res.status(403).json({ message: "Forbidden: Not a member of this conversation" });
    }

    if (widget.pollData.closedAt && new Date() > new Date(widget.pollData.closedAt)) {
      return res.status(400).json({ message: "This poll has concluded and is closed to new votes." });
    }

    const options = widget.pollData.options;
    const targetOption = options.find((o) => o.id === optionId);
    if (!targetOption) {
      return res.status(404).json({ message: "Option not found in poll" });
    }

    const alreadyVotedIndex = targetOption.votes.findIndex(
      (v) => v.user?.toString() === userId.toString()
    );

    if (alreadyVotedIndex > -1) {
      // Toggle off
      targetOption.votes.splice(alreadyVotedIndex, 1);
    } else {
      // If single choice, remove user votes from all other options
      if (!widget.pollData.isMultiChoice) {
        options.forEach((opt) => {
          opt.votes = opt.votes.filter((v) => v.user?.toString() !== userId.toString());
        });
      }
      targetOption.votes.push({ user: userId, votedAt: new Date() });
    }

    widget.markModified("pollData.options");
    await widget.save();

    return res.status(200).json({ widget });
  } catch (err) {
    console.error("Error voting on poll:", err);
    return res.status(500).json({ message: "Failed to submit vote" });
  }
}

/**
 * 3. Create a Shared Checklist
 */
export async function createChecklist(req, res) {
  try {
    const userId = req.user.id;
    const { conversationId, title, items } = req.body;

    if (!title || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Checklist requires a title and at least 1 task" });
    }

    const isMember = await verifyMembership(conversationId, userId);
    if (!isMember) {
      return res.status(403).json({ message: "Forbidden: Not a member of this conversation" });
    }

    const checklistItems = items.map((item) => {
      const text = typeof item === "string" ? item : item.text;
      return {
        id: crypto.randomUUID(),
        text: text.trim(),
        completed: false,
        completedBy: null,
        completedAt: null,
        assignedTo: null,
      };
    });

    const widget = await widgetModel.create({
      conversation: conversationId,
      creator: userId,
      type: "checklist",
      title: title.trim(),
      checklistData: {
        items: checklistItems,
      },
    });

    const clientMessageId = crypto.randomUUID();
    const message = await messageModel.create({
      conversation: conversationId,
      sender: userId,
      clientMessageId,
      type: "widget",
      widget: widget._id,
      text: `📋 Checklist: ${title.trim()}`,
    });

    widget.message = message._id;
    await widget.save();

    return res.status(201).json({ widget, message });
  } catch (err) {
    console.error("Error creating checklist:", err);
    return res.status(500).json({ message: "Failed to create checklist" });
  }
}

/**
 * 4. Toggle or add item in a Checklist
 */
export async function toggleChecklistItem(req, res) {
  try {
    const userId = req.user.id;
    const { widgetId, itemId } = req.params;

    const widget = await widgetModel.findById(widgetId);
    if (!widget || widget.type !== "checklist") {
      return res.status(404).json({ message: "Checklist not found" });
    }

    const isMember = await verifyMembership(widget.conversation, userId);
    if (!isMember) {
      return res.status(403).json({ message: "Forbidden: Not a member of this conversation" });
    }

    const item = widget.checklistData.items.find((i) => i.id === itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found in checklist" });
    }

    item.completed = !item.completed;
    item.completedBy = item.completed ? userId : null;
    item.completedAt = item.completed ? new Date() : null;

    widget.markModified("checklistData.items");
    await widget.save();

    return res.status(200).json({ widget });
  } catch (err) {
    console.error("Error toggling checklist item:", err);
    return res.status(500).json({ message: "Failed to update item" });
  }
}

export async function addChecklistItem(req, res) {
  try {
    const userId = req.user.id;
    const { widgetId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Item text is required" });
    }

    const widget = await widgetModel.findById(widgetId);
    if (!widget || widget.type !== "checklist") {
      return res.status(404).json({ message: "Checklist not found" });
    }

    const isMember = await verifyMembership(widget.conversation, userId);
    if (!isMember) {
      return res.status(403).json({ message: "Forbidden: Not a member of this conversation" });
    }

    widget.checklistData.items.push({
      id: crypto.randomUUID(),
      text: text.trim(),
      completed: false,
      completedBy: null,
      completedAt: null,
      assignedTo: null,
    });

    widget.markModified("checklistData.items");
    await widget.save();

    return res.status(200).json({ widget });
  } catch (err) {
    console.error("Error adding checklist item:", err);
    return res.status(500).json({ message: "Failed to add item" });
  }
}

/**
 * 5. Create a Meeting Point
 */
export async function createMeetingPoint(req, res) {
  try {
    const userId = req.user.id;
    const { conversationId, venueName, scheduledTime, latitude, longitude } = req.body;

    if (!venueName || !latitude || !longitude) {
      return res.status(400).json({ message: "Meeting Point requires venue name and GPS coordinates" });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ message: "Invalid GPS coordinates" });
    }

    const isMember = await verifyMembership(conversationId, userId);
    if (!isMember) {
      return res.status(403).json({ message: "Forbidden: Not a member of this conversation" });
    }

    const widget = await widgetModel.create({
      conversation: conversationId,
      creator: userId,
      type: "meeting_point",
      title: venueName.trim(),
      meetingPointData: {
        venueName: venueName.trim(),
        scheduledTime: scheduledTime ? new Date(scheduledTime) : null,
        latitude: lat,
        longitude: lng,
        attendeesHere: [{ user: userId, checkedInAt: new Date() }],
      },
    });

    const clientMessageId = crypto.randomUUID();
    const message = await messageModel.create({
      conversation: conversationId,
      sender: userId,
      clientMessageId,
      type: "widget",
      widget: widget._id,
      text: `📍 Meeting Point: ${venueName.trim()}`,
      locationData: {
        latitude: lat,
        longitude: lng,
        accuracy: 15,
        label: venueName.trim(),
      },
    });

    widget.message = message._id;
    await widget.save();

    return res.status(201).json({ widget, message });
  } catch (err) {
    console.error("Error creating meeting point:", err);
    return res.status(500).json({ message: "Failed to create meeting point" });
  }
}

/**
 * 6. "I'm Here" check-in at Meeting Point
 */
export async function checkInMeetingPoint(req, res) {
  try {
    const userId = req.user.id;
    const { widgetId } = req.params;

    const widget = await widgetModel.findById(widgetId);
    if (!widget || widget.type !== "meeting_point") {
      return res.status(404).json({ message: "Meeting point not found" });
    }

    const isMember = await verifyMembership(widget.conversation, userId);
    if (!isMember) {
      return res.status(403).json({ message: "Forbidden: Not a member of this conversation" });
    }

    const alreadyCheckedIn = widget.meetingPointData.attendeesHere.some(
      (a) => a.user?.toString() === userId.toString()
    );

    if (alreadyCheckedIn) {
      // Toggle off
      widget.meetingPointData.attendeesHere = widget.meetingPointData.attendeesHere.filter(
        (a) => a.user?.toString() !== userId.toString()
      );
    } else {
      widget.meetingPointData.attendeesHere.push({
        user: userId,
        checkedInAt: new Date(),
      });
    }

    widget.markModified("meetingPointData.attendeesHere");
    await widget.save();

    return res.status(200).json({ widget });
  } catch (err) {
    console.error("Error checking in at meeting point:", err);
    return res.status(500).json({ message: "Failed to check in" });
  }
}

/**
 * 7. Create a Social Question & Answer
 */
export async function createQuestion(req, res) {
  try {
    const userId = req.user.id;
    const { conversationId, prompt } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ message: "Question prompt is required" });
    }

    const isMember = await verifyMembership(conversationId, userId);
    if (!isMember) {
      return res.status(403).json({ message: "Forbidden: Not a member of this conversation" });
    }

    const widget = await widgetModel.create({
      conversation: conversationId,
      creator: userId,
      type: "question",
      title: prompt.trim(),
      questionData: {
        prompt: prompt.trim(),
        answers: [],
      },
    });

    const clientMessageId = crypto.randomUUID();
    const message = await messageModel.create({
      conversation: conversationId,
      sender: userId,
      clientMessageId,
      type: "widget",
      widget: widget._id,
      text: `❓ Question: ${prompt.trim()}`,
    });

    widget.message = message._id;
    await widget.save();

    return res.status(201).json({ widget, message });
  } catch (err) {
    console.error("Error creating question:", err);
    return res.status(500).json({ message: "Failed to create question" });
  }
}

export async function answerQuestion(req, res) {
  try {
    const userId = req.user.id;
    const { widgetId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Answer text is required" });
    }

    const widget = await widgetModel.findById(widgetId);
    if (!widget || widget.type !== "question") {
      return res.status(404).json({ message: "Question not found" });
    }

    const isMember = await verifyMembership(widget.conversation, userId);
    if (!isMember) {
      return res.status(403).json({ message: "Forbidden: Not a member of this conversation" });
    }

    widget.questionData.answers.push({
      user: userId,
      text: text.trim(),
      createdAt: new Date(),
    });

    widget.markModified("questionData.answers");
    await widget.save();

    return res.status(200).json({ widget });
  } catch (err) {
    console.error("Error answering question:", err);
    return res.status(500).json({ message: "Failed to submit answer" });
  }
}

/**
 * 8. Fetch details of a single widget
 */
export async function getWidgetDetails(req, res) {
  try {
    const userId = req.user.id;
    const { widgetId } = req.params;

    const widget = await widgetModel
      .findById(widgetId)
      .populate("creator", "firstName lastName")
      .populate("checklistData.items.completedBy", "firstName lastName")
      .populate("meetingPointData.attendeesHere.user", "firstName lastName")
      .populate("questionData.answers.user", "firstName lastName")
      .populate("pollData.options.votes.user", "firstName lastName");

    if (!widget) {
      return res.status(404).json({ message: "Widget not found" });
    }

    const isMember = await verifyMembership(widget.conversation, userId);
    if (!isMember) {
      return res.status(403).json({ message: "Forbidden: Not a member of this conversation" });
    }

    return res.status(200).json({ widget });
  } catch (err) {
    console.error("Error getting widget details:", err);
    return res.status(500).json({ message: "Failed to fetch widget" });
  }
}
