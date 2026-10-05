import mongoose from "mongoose";
import conversationModel from "../models/conversation.model.js";
import conversationMemberModel from "../models/conversationMember.model.js";
import messageModel from "../models/message.model.js";
import chapterModel from "../models/chapter.model.js";
import chapterMessageModel from "../models/chapterMessage.model.js";
import contactIdentityModel from "../models/contactIdentity.model.js";
import crewIdentityModel from "../models/crewIdentity.model.js";
import profileModel from "../models/profile.model.js";
import userModel from "../models/user.model.js";
import widgetModel from "../models/widget.model.js";
import experienceModel from "../models/experience.model.js";
import momentModel from "../models/moment.model.js";
import { createNotification, createGroupedNotification } from "../services/notification.service.js";

/**
 * 1. Get all conversations for the authenticated user
 * Enriched with participants, profiles, unread counts, and local contact aliases
 */
export async function getConversations(req, res) {
  try {
    const userId = req.user.id;

    // Find memberships of current user
    const userMemberships = await conversationMemberModel
      .find({ user: userId })
      .lean();

    if (!userMemberships || userMemberships.length === 0) {
      return res.status(200).json({ conversations: [] });
    }

    const conversationIds = userMemberships.map((m) => m.conversation);

    // Fetch conversation documents
    const conversations = await conversationModel
      .find({ _id: { $in: conversationIds } })
      .sort({ updatedAt: -1 })
      .lean();

    // Fetch all members for these conversations
    const allMembers = await conversationMemberModel
      .find({ conversation: { $in: conversationIds } })
      .populate("user", "firstName lastName email")
      .lean();

    // Fetch profiles for users in these conversations
    const memberUserIds = [
      ...new Set(allMembers.map((m) => m.user?._id?.toString()).filter(Boolean)),
    ];
    const profiles = await profileModel
      .find({ user: { $in: memberUserIds } })
      .lean();
    const profileMap = new Map();
    profiles.forEach((p) => {
      profileMap.set(p.user.toString(), p);
    });

    // Fetch personal contact identities for this user
    const contactIdentities = await contactIdentityModel
      .find({ owner: userId })
      .lean();
    const contactAliasMap = new Map();
    contactIdentities.forEach((ci) => {
      contactAliasMap.set(ci.targetUser.toString(), ci);
    });

    // Calculate unread count and assemble response
    const enrichedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const myMembership = userMemberships.find(
          (m) => m.conversation.toString() === conv._id.toString()
        );

        const convMembers = allMembers.filter(
          (m) => m.conversation.toString() === conv._id.toString()
        );

        // Calculate unread messages (messages created after lastReadAt and not sent by current user)
        const unreadCount = await messageModel.countDocuments({
          conversation: conv._id,
          sender: { $ne: userId },
          createdAt: { $gt: myMembership?.lastReadAt || new Date(0) },
          deletedFor: { $ne: userId },
        });

        // Assemble participants with profile and contact alias
        const participants = convMembers.map((m) => {
          const uId = m.user?._id?.toString();
          const prof = profileMap.get(uId);
          const alias = contactAliasMap.get(uId);

          const defaultName = m.user
            ? `${m.user.firstName} ${m.user.lastName || ""}`.trim()
            : "User";

          return {
            userId: uId,
            role: m.role,
            firstName: m.user?.firstName || "",
            lastName: m.user?.lastName || "",
            userName: prof?.userName || "user",
            profilePhoto: prof?.profilePhoto || "",
            bio: prof?.bio || "",
            // Personal contact alias takes precedence in user's UI
            displayName: alias?.privateNickname || prof?.userName || defaultName,
            customAvatar: alias?.privateAvatar || prof?.profilePhoto || "",
            isAliasSet: !!alias?.privateNickname,
          };
        });

        // If direct chat, title is the other participant's display name
        let displayTitle = conv.title;
        let displayAvatar = conv.avatar;

        if (conv.type === "direct") {
          const other = participants.find((p) => p.userId !== userId);
          if (other) {
            displayTitle = other.displayName;
            displayAvatar = other.customAvatar;
          }
        }

        // Check if last message was sent by me and if it was seen
        let isLastMine = false;
        let isLastSeen = false;
        if (conv.lastMessage?.sender) {
          isLastMine = conv.lastMessage.sender.toString() === userId.toString();
          if (isLastMine) {
            const otherMembers = allMembers.filter(
              (m) =>
                m.conversation.toString() === conv._id.toString() &&
                m.user?._id?.toString() !== userId.toString()
            );
            const maxOtherLastRead = otherMembers.reduce((latest, m) => {
              if (!m.lastReadAt) return latest;
              const d = new Date(m.lastReadAt);
              return !latest || d > latest ? d : latest;
            }, null);
            if (
              maxOtherLastRead &&
              new Date(conv.lastMessage.timestamp).getTime() <=
                maxOtherLastRead.getTime() + 1000
            ) {
              isLastSeen = true;
            }
          }
        }

        const enrichedLastMessage = conv.lastMessage
          ? {
              ...(typeof conv.lastMessage.toObject === "function"
                ? conv.lastMessage.toObject()
                : conv.lastMessage),
              isMine: isLastMine,
              isSeen: isLastSeen,
            }
          : null;

        return {
          _id: conv._id,
          type: conv.type,
          title: displayTitle || "Chat",
          avatar: displayAvatar,
          lastMessage: enrichedLastMessage,
          settings: conv.settings,
          unreadCount,
          participants,
          updatedAt: conv.updatedAt,
        };
      })
    );

    return res.status(200).json({ conversations: enrichedConversations });
  } catch (err) {
    console.error("Error in getConversations:", err);
    return res.status(500).json({ message: "Failed to fetch conversations" });
  }
}

/**
 * 2. Get or create a direct 1-on-1 conversation
 */
export async function getOrCreateDirectChat(req, res) {
  try {
    const userId = req.user.id;
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ message: "targetUserId is required" });
    }

    if (userId === targetUserId) {
      return res
        .status(400)
        .json({ message: "Cannot create a conversation with yourself" });
    }

    // Verify target user exists
    const targetUser = await userModel.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: "Target user not found" });
    }

    // Find if a direct conversation already exists between both users
    const myMemberships = await conversationMemberModel.find({ user: userId });
    const myConvIds = myMemberships.map((m) => m.conversation);

    const existingTargetMember = await conversationMemberModel.findOne({
      conversation: { $in: myConvIds },
      user: targetUserId,
    });

    if (existingTargetMember) {
      const existingConv = await conversationModel.findOne({
        _id: existingTargetMember.conversation,
        type: "direct",
      });

      if (existingConv) {
        return res.status(200).json({ conversation: existingConv });
      }
    }

    // Create new direct conversation
    const newConv = await conversationModel.create({
      type: "direct",
      lastMessage: {
        text: "Conversation started",
        sender: userId,
        messageType: "system",
        timestamp: new Date(),
      },
    });

    // Create membership records for both
    await conversationMemberModel.create([
      { conversation: newConv._id, user: userId, role: "admin" },
      { conversation: newConv._id, user: targetUserId, role: "member" },
    ]);

    return res.status(201).json({ conversation: newConv });
  } catch (err) {
    console.error("Error in getOrCreateDirectChat:", err);
    return res
      .status(500)
      .json({ message: "Failed to create or fetch direct conversation" });
  }
}

/**
 * 3. Fetch cursor-paginated messages with membership authorization
 */
export async function getMessages(req, res) {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;
    const { cursor, limit = 30 } = req.query;
    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 30, 5), 100);

    // Verify membership authorization
    const membership = await conversationMemberModel.findOne({
      conversation: conversationId,
      user: userId,
    });

    if (!membership) {
      return res
        .status(403)
        .json({ message: "Forbidden: You are not a member of this conversation" });
    }

    const query = {
      conversation: conversationId,
      deletedFor: { $ne: userId },
    };

    if (cursor) {
      query._id = { $lt: cursor };
    }

    // Fetch limit + 1 to check if there are more
    const rawMessages = await messageModel
      .find(query)
      .sort({ _id: -1 })
      .limit(parsedLimit + 1)
      .populate("sender", "firstName lastName email")
      .populate("locationShare")
      .populate({
        path: "widget",
        populate: [
          { path: "creator", select: "firstName lastName" },
          { path: "pollData.options.votes.user", select: "firstName lastName" },
          { path: "checklistData.items.completedBy", select: "firstName lastName" },
          { path: "meetingPointData.attendeesHere.user", select: "firstName lastName" },
          { path: "questionData.answers.user", select: "firstName lastName" },
        ],
      })
      .populate({
        path: "experience",
        populate: [
          { path: "creator", select: "firstName lastName" },
          { path: "rsvps.user", select: "firstName lastName" },
        ],
      })
      .populate("moment")
      .lean();

    const hasMore = rawMessages.length > parsedLimit;
    const messagesSlice = hasMore ? rawMessages.slice(0, parsedLimit) : rawMessages;

    // Fetch sender profile photos
    const senderIds = [
      ...new Set(messagesSlice.map((m) => m.sender?._id?.toString()).filter(Boolean)),
    ];
    const profiles = await profileModel.find({ user: { $in: senderIds } }).lean();
    const profileMap = new Map();
    profiles.forEach((p) => profileMap.set(p.user.toString(), p));

    // Fetch personal contact identities for sender nicknames
    const contactIdentities = await contactIdentityModel
      .find({ owner: userId, targetUser: { $in: senderIds } })
      .lean();
    const aliasMap = new Map();
    contactIdentities.forEach((ci) => aliasMap.set(ci.targetUser.toString(), ci));

    // Fetch other members in conversation to compute seen status
    const otherMembers = await conversationMemberModel
      .find({ conversation: conversationId, user: { $ne: userId } })
      .select("user lastReadAt lastReadMessageId")
      .lean();

    let maxOtherLastReadAt = null;
    const otherReadMessageIds = new Set();
    for (const m of otherMembers) {
      if (m.lastReadAt) {
        const d = new Date(m.lastReadAt);
        if (!maxOtherLastReadAt || d > maxOtherLastReadAt) {
          maxOtherLastReadAt = d;
        }
      }
      if (m.lastReadMessageId) {
        otherReadMessageIds.add(m.lastReadMessageId.toString());
      }
    }

    // Update current user's lastReadAt when reading latest messages
    if (!cursor) {
      await conversationMemberModel.updateOne(
        { conversation: conversationId, user: userId },
        { $set: { lastReadAt: new Date() } }
      );
    }

    const enrichedMessages = messagesSlice.map((msg) => {
      const sId = msg.sender?._id?.toString();
      const prof = profileMap.get(sId);
      const alias = aliasMap.get(sId);
      const senderDefault = msg.sender
        ? `${msg.sender.firstName} ${msg.sender.lastName || ""}`.trim()
        : "User";

      // An outgoing message is seen if any recipient read after it was sent
      const msgTime = new Date(msg.createdAt).getTime();
      const isMsgSeen = Boolean(
        (maxOtherLastReadAt && msgTime <= maxOtherLastReadAt.getTime() + 1000) ||
        (msg._id && otherReadMessageIds.has(msg._id.toString()))
      );

      return {
        _id: msg._id,
        conversationId: msg.conversation,
        senderId: sId,
        senderName: alias?.privateNickname || prof?.userName || senderDefault,
        senderAvatar: alias?.privateAvatar || prof?.profilePhoto || "",
        clientMessageId: msg.clientMessageId,
        type: msg.type,
        text: msg.isDeletedForEveryone ? "This message was deleted" : msg.text,
        mediaUrl: msg.isDeletedForEveryone ? "" : msg.mediaUrl,
        mediaType: msg.mediaType,
        replyTo: msg.replyTo,
        replyPreview: msg.replyPreview,
        celebrationType: msg.celebrationType,
        locationShare: msg.locationShare || null,
        locationData: msg.locationData || null,
        widget: msg.widget || null,
        experience: msg.experience || null,
        moment: msg.moment || null,
        reactions: msg.reactions || [],
        isDeletedForEveryone: msg.isDeletedForEveryone,
        isSeen: sId === userId.toString() ? isMsgSeen : true,
        seenAt: maxOtherLastReadAt,
        editedAt: msg.editedAt,
        createdAt: msg.createdAt,
      };
    });

    // Reverse to chronological order (oldest to newest)
    enrichedMessages.reverse();

    const nextCursor = hasMore && messagesSlice.length > 0 ? messagesSlice[messagesSlice.length - 1]._id : null;

    return res.status(200).json({
      messages: enrichedMessages,
      nextCursor,
      hasMore,
    });
  } catch (err) {
    console.error("Error in getMessages:", err);
    return res.status(500).json({ message: "Failed to fetch messages" });
  }
}

/**
 * 3b. Search conversation with category filters and cursor pagination
 */
export async function searchConversation(req, res) {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;
    const {
      query = "",
      category = "all",
      startDate,
      endDate,
      cursor,
      limit = 25,
    } = req.query;

    const membership = await conversationMemberModel.findOne({
      conversation: conversationId,
      user: userId,
    });

    if (!membership) {
      return res.status(403).json({ message: "Forbidden: Not a member of this conversation" });
    }

    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 25, 5), 100);

    // If searching chapters specifically
    if (category === "chapters") {
      const chapterQuery = { conversation: conversationId };
      if (query && query.trim()) {
        chapterQuery.name = { $regex: query.trim(), $options: "i" };
      }
      const chapters = await chapterModel
        .find(chapterQuery)
        .sort({ createdAt: -1 })
        .limit(parsedLimit)
        .populate("creator", "firstName lastName")
        .lean();
      return res.status(200).json({ results: chapters, type: "chapters" });
    }

    // If searching moments specifically
    if (category === "moments") {
      const momentQuery = { conversation: conversationId };
      if (query && query.trim()) {
        momentQuery.title = { $regex: query.trim(), $options: "i" };
      }
      const moments = await momentModel
        .find(momentQuery)
        .sort({ createdAt: -1 })
        .limit(parsedLimit)
        .populate("creator", "firstName lastName")
        .lean();
      return res.status(200).json({ results: moments, type: "moments" });
    }

    // Otherwise querying messages
    const messageQuery = {
      conversation: conversationId,
      deletedFor: { $ne: userId },
      isDeletedForEveryone: false,
    };

    if (cursor) {
      messageQuery._id = { $lt: cursor };
    }

    if (query && query.trim()) {
      messageQuery.text = { $regex: query.trim(), $options: "i" };
    }

    if (category === "messages") {
      messageQuery.type = "text";
    } else if (category === "photos") {
      messageQuery.type = "image";
    } else if (category === "videos") {
      messageQuery.type = "video";
    } else if (category === "voice") {
      messageQuery.type = "voice";
    } else if (category === "files") {
      messageQuery.type = "file";
    } else if (category === "links") {
      messageQuery.text = { $regex: "https?://", $options: "i" };
    } else if (category === "locations") {
      messageQuery.type = { $in: ["location", "live_location", "meeting_point"] };
    } else if (category === "polls") {
      messageQuery.type = { $in: ["poll", "widget"] };
    }

    if (startDate) {
      messageQuery.createdAt = { ...messageQuery.createdAt, $gte: new Date(startDate) };
    }
    if (endDate) {
      messageQuery.createdAt = { ...messageQuery.createdAt, $lte: new Date(endDate) };
    }

    const messages = await messageModel
      .find(messageQuery)
      .sort({ _id: -1 })
      .limit(parsedLimit + 1)
      .populate("sender", "firstName lastName email")
      .populate("locationShare")
      .populate({
        path: "widget",
        populate: [
          { path: "creator", select: "firstName lastName" },
          { path: "pollData.options.votes.user", select: "firstName lastName" },
          { path: "checklistData.items.completedBy", select: "firstName lastName" },
          { path: "meetingPointData.attendeesHere.user", select: "firstName lastName" },
          { path: "questionData.answers.user", select: "firstName lastName" },
        ],
      })
      .populate({
        path: "experience",
        populate: [
          { path: "creator", select: "firstName lastName" },
          { path: "rsvps.user", select: "firstName lastName" },
        ],
      })
      .populate("moment")
      .lean();

    const hasMore = messages.length > parsedLimit;
    const slice = hasMore ? messages.slice(0, parsedLimit) : messages;

    return res.status(200).json({
      results: slice,
      type: "messages",
      nextCursor: hasMore && slice.length > 0 ? slice[slice.length - 1]._id : null,
      hasMore,
    });
  } catch (err) {
    console.error("Error in searchConversation:", err);
    return res.status(500).json({ message: "Failed to search conversation" });
  }
}

/**
 * 4. Send message with clientMessageId idempotency & reply snapshot
 */
export async function sendMessage(req, res) {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;
    const {
      clientMessageId,
      text,
      type = "text",
      mediaUrl = "",
      mediaType = "",
      replyTo = null,
      celebrationType = null,
    } = req.body;

    if (!clientMessageId) {
      return res.status(400).json({ message: "clientMessageId is required" });
    }

    // Verify membership authorization
    const membership = await conversationMemberModel.findOne({
      conversation: conversationId,
      user: userId,
    });

    if (!membership) {
      return res
        .status(403)
        .json({ message: "Forbidden: You are not a member of this conversation" });
    }

    // Idempotency check: if clientMessageId already exists, return existing
    const existingMessage = await messageModel.findOne({ clientMessageId });
    if (existingMessage) {
      return res.status(200).json({
        message: {
          ...existingMessage.toObject(),
          senderId: existingMessage.sender.toString(),
          isSeen: false,
        },
        isDuplicate: true,
      });
    }

    // If replyTo provided, build lightweight replyPreview snapshot
    let replyPreview = null;
    if (replyTo) {
      const parentMsg = await messageModel
        .findById(replyTo)
        .populate("sender", "firstName lastName")
        .lean();
      if (parentMsg) {
        replyPreview = {
          messageId: parentMsg._id,
          senderName: parentMsg.sender
            ? `${parentMsg.sender.firstName} ${parentMsg.sender.lastName || ""}`.trim()
            : "User",
          textPreview: parentMsg.text
            ? parentMsg.text.slice(0, 80)
            : parentMsg.type === "image"
            ? "📷 Photo"
            : "📎 Media",
          mediaType: parentMsg.mediaType || parentMsg.type,
        };
      }
    }

    // Create the message
    const newMessage = await messageModel.create({
      conversation: conversationId,
      sender: userId,
      clientMessageId,
      type,
      text: text || "",
      mediaUrl,
      mediaType,
      replyTo,
      replyPreview,
      celebrationType,
    });

    // Update conversation lastMessage & timestamp
    let previewSnippet = text;
    if (!previewSnippet) {
      if (type === "image") previewSnippet = "📷 Photo";
      else if (type === "voice") previewSnippet = "🎙 Voice note";
      else if (type === "celebration") previewSnippet = `🎉 Celebration: ${celebrationType || "Vibe"}`;
      else previewSnippet = "📎 Attachment";
    }

    await conversationModel.findByIdAndUpdate(conversationId, {
      lastMessage: {
        text: previewSnippet,
        sender: userId,
        messageType: type,
        timestamp: newMessage.createdAt,
      },
    });

    // Update sender's read pointer
    await conversationMemberModel.findOneAndUpdate(
      { conversation: conversationId, user: userId },
      {
        lastReadMessageId: newMessage._id,
        lastReadAt: newMessage.createdAt,
      }
    );

    // Notify other conversation members
    conversationMemberModel
      .find({ conversation: conversationId, user: { $ne: userId } })
      .select("user")
      .lean()
      .then((otherMembers) => {
        for (const m of otherMembers) {
          createNotification({
            recipient: m.user,
            actor: userId,
            type: replyTo ? "REPLY" : "MESSAGE",
            category: "chats",
            priority: "high",
            title: replyTo ? "Reply to your message" : "New Message",
            body: previewSnippet ? previewSnippet.slice(0, 80) : "Sent a message",
            entityType: "conversation",
            entityId: conversationId,
            deepLink: `/chats?c=${conversationId}`,
            sourceEventId: `msg:${newMessage._id}`,
          }).catch((e) => console.error("Msg notif error:", e));
        }
      })
      .catch((e) => console.error("Members fetch notif error:", e));

    // Populate sender info for immediate frontend use
    const populated = await messageModel
      .findById(newMessage._id)
      .populate("sender", "firstName lastName email")
      .lean();

    const senderProfile = await profileModel.findOne({ user: userId }).lean();

    const enriched = {
      _id: populated._id,
      conversationId: populated.conversation,
      senderId: userId,
      senderName: senderProfile?.userName || populated.sender?.firstName || "User",
      senderAvatar: senderProfile?.profilePhoto || "",
      clientMessageId: populated.clientMessageId,
      type: populated.type,
      text: populated.text,
      mediaUrl: populated.mediaUrl,
      mediaType: populated.mediaType,
      replyTo: populated.replyTo,
      replyPreview: populated.replyPreview,
      celebrationType: populated.celebrationType,
      reactions: populated.reactions || [],
      isDeletedForEveryone: false,
      isSeen: false,
      createdAt: populated.createdAt,
    };

    return res.status(201).json({ message: enriched });
  } catch (err) {
    console.error("Error in sendMessage:", err);
    return res.status(500).json({ message: "Failed to send message" });
  }
}

/**
 * 5. Mark conversation as read (updates member read pointer)
 */
export async function markConversationRead(req, res) {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;
    const { messageId } = req.body;

    const updateFields = { lastReadAt: new Date() };
    if (messageId && mongoose.isValidObjectId(messageId)) {
      updateFields.lastReadMessageId = messageId;
    }

    await conversationMemberModel.findOneAndUpdate(
      { conversation: conversationId, user: userId },
      updateFields
    );

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Error in markConversationRead:", err);
    return res.status(500).json({ message: "Failed to update read state" });
  }
}

/**
 * 6. Toggle emoji reaction on a message
 */
export async function toggleReaction(req, res) {
  try {
    const userId = req.user.id;
    const { messageId } = req.params;
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({ message: "emoji is required" });
    }

    const msg = await messageModel.findById(messageId);
    if (!msg) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Verify membership
    const membership = await conversationMemberModel.findOne({
      conversation: msg.conversation,
      user: userId,
    });
    if (!membership) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const existingIndex = msg.reactions.findIndex(
      (r) => r.user.toString() === userId && r.emoji === emoji
    );

    if (existingIndex > -1) {
      // Remove reaction
      msg.reactions.splice(existingIndex, 1);
    } else {
      // Add reaction (limit 1 emoji per user or toggle)
      const userOtherIndex = msg.reactions.findIndex(
        (r) => r.user.toString() === userId
      );
      if (userOtherIndex > -1) {
        msg.reactions[userOtherIndex].emoji = emoji;
      } else {
        msg.reactions.push({ user: userId, emoji });
      }

      // Notify message sender of reaction (self-action protected)
      if (msg.sender && msg.sender.toString() !== userId) {
        createGroupedNotification({
          recipient: msg.sender,
          actor: userId,
          type: "REACTION",
          category: "chats",
          priority: "low",
          groupKey: `reaction_msg_${msg._id}`,
          entityType: "message",
          entityId: msg._id,
          deepLink: `/chats?c=${msg.conversation}`,
          metadata: { emoji },
          targetTitle: "message",
        }).catch((e) => console.error("Reaction notif error:", e));
      }
    }

    await msg.save();
    return res.status(200).json({ reactions: msg.reactions, messageId });
  } catch (err) {
    console.error("Error in toggleReaction:", err);
    return res.status(500).json({ message: "Failed to toggle reaction" });
  }
}

/**
 * 7. Edit message content
 */
export async function editMessage(req, res) {
  try {
    const userId = req.user.id;
    const { messageId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Text cannot be empty" });
    }

    const msg = await messageModel.findById(messageId);
    if (!msg) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (msg.sender.toString() !== userId) {
      return res.status(403).json({ message: "Forbidden: You can only edit your own messages" });
    }

    if (msg.isDeletedForEveryone) {
      return res.status(400).json({ message: "Cannot edit deleted message" });
    }

    msg.text = text.trim();
    msg.editedAt = new Date();
    await msg.save();

    return res.status(200).json({ message: msg });
  } catch (err) {
    console.error("Error in editMessage:", err);
    return res.status(500).json({ message: "Failed to edit message" });
  }
}

/**
 * 8. Delete message (soft-delete for user or everyone)
 */
export async function deleteMessage(req, res) {
  try {
    const userId = req.user.id;
    const { messageId } = req.params;
    const { forEveryone = false } = req.body;

    const msg = await messageModel.findById(messageId);
    if (!msg) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (forEveryone) {
      if (msg.sender.toString() !== userId) {
        return res
          .status(403)
          .json({ message: "Forbidden: Only sender can delete for everyone" });
      }
      msg.isDeletedForEveryone = true;
      msg.text = "This message was deleted";
      msg.mediaUrl = "";
      await msg.save();
    } else {
      if (!msg.deletedFor.includes(userId)) {
        msg.deletedFor.push(userId);
        await msg.save();
      }
    }

    return res.status(200).json({ success: true, messageId, forEveryone });
  } catch (err) {
    console.error("Error in deleteMessage:", err);
    return res.status(500).json({ message: "Failed to delete message" });
  }
}

/**
 * 9. Create a Chapter from selected messages via ChapterMessage junction
 */
export async function createChapter(req, res) {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;
    const {
      name,
      description = "",
      coverImage = "",
      visibility = "conversation_members",
      allowedMembers = [],
      messageIds = [],
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Chapter name is required" });
    }

    // Verify membership
    const membership = await conversationMemberModel.findOne({
      conversation: conversationId,
      user: userId,
    });
    if (!membership) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const chapter = await chapterModel.create({
      conversation: conversationId,
      creator: userId,
      name: name.trim(),
      description: description.trim(),
      coverImage,
      visibility,
      allowedMembers,
      collaborators: [{ user: userId, role: "owner" }],
      activityLog: [
        {
          action: "created",
          user: userId,
          timestamp: new Date(),
          metadata: { initialMessageCount: messageIds.length },
        },
      ],
    });

    // Populate junction records for each message
    if (Array.isArray(messageIds) && messageIds.length > 0) {
      const junctionItems = messageIds.map((msgId) => ({
        chapter: chapter._id,
        message: msgId,
        addedBy: userId,
      }));

      // Avoid duplicates with ordered: false
      try {
        await chapterMessageModel.insertMany(junctionItems, { ordered: false });
      } catch (insertErr) {
        // Ignore duplicate key errors if already present
      }
    }

    return res.status(201).json({ chapter, messageCount: messageIds.length });
  } catch (err) {
    console.error("Error in createChapter:", err);
    return res.status(500).json({ message: "Failed to create chapter" });
  }
}

/**
 * 10. Get all chapters in a conversation with permission check
 */
export async function getChapters(req, res) {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;

    const membership = await conversationMemberModel.findOne({
      conversation: conversationId,
      user: userId,
    });
    if (!membership) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Find chapters that are conversation_members or created by user or allowedMembers includes user
    const chapters = await chapterModel
      .find({
        conversation: conversationId,
        $or: [
          { visibility: "conversation_members" },
          { creator: userId },
          { allowedMembers: userId },
        ],
      })
      .sort({ createdAt: -1 })
      .populate("creator", "firstName lastName")
      .lean();

    // Enrich with message count
    const enrichedChapters = await Promise.all(
      chapters.map(async (ch) => {
        const count = await chapterMessageModel.countDocuments({
          chapter: ch._id,
        });
        return {
          ...ch,
          messageCount: count,
        };
      })
    );

    return res.status(200).json({ chapters: enrichedChapters });
  } catch (err) {
    console.error("Error in getChapters:", err);
    return res.status(500).json({ message: "Failed to fetch chapters" });
  }
}

/**
 * 11. Get messages inside a specific chapter
 */
export async function getChapterMessages(req, res) {
  try {
    const userId = req.user.id;
    const { chapterId } = req.params;

    const chapter = await chapterModel.findById(chapterId).lean();
    if (!chapter) {
      return res.status(404).json({ message: "Chapter not found" });
    }

    // Verify permission
    const membership = await conversationMemberModel.findOne({
      conversation: chapter.conversation,
      user: userId,
    });
    if (!membership) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (
      chapter.visibility === "private" &&
      chapter.creator.toString() !== userId
    ) {
      return res.status(403).json({ message: "Forbidden: This chapter is private" });
    }

    // Fetch junction records
    const junctionRecords = await chapterMessageModel
      .find({ chapter: chapterId })
      .sort({ createdAt: 1 })
      .populate({
        path: "message",
        populate: { path: "sender", select: "firstName lastName email" },
      })
      .lean();

    const messages = junctionRecords
      .map((j) => j.message)
      .filter((m) => m && !m.deletedFor?.includes(userId));

    return res.status(200).json({ chapter, messages });
  } catch (err) {
    console.error("Error in getChapterMessages:", err);
    return res.status(500).json({ message: "Failed to fetch chapter messages" });
  }
}

/**
 * 11b. Add selected messages to an existing custom category / chapter
 */
export async function addMessagesToChapter(req, res) {
  try {
    const userId = req.user.id;
    const { chapterId } = req.params;
    const { messageIds } = req.body;

    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({ message: "messageIds array is required" });
    }

    const chapter = await chapterModel.findById(chapterId);
    if (!chapter) {
      return res.status(404).json({ message: "Category not found" });
    }

    const junctionItems = messageIds.map((msgId) => ({
      chapter: chapter._id,
      message: msgId,
      addedBy: userId,
    }));

    try {
      await chapterMessageModel.insertMany(junctionItems, { ordered: false });
    } catch (e) {
      // ignore duplicates
    }

    const count = await chapterMessageModel.countDocuments({ chapter: chapter._id });
    return res.status(200).json({ success: true, messageCount: count });
  } catch (err) {
    console.error("Error in addMessagesToChapter:", err);
    return res.status(500).json({ message: "Failed to add messages to category" });
  }
}

/**
 * 11c. Delete a custom category / chapter
 */
export async function deleteChapter(req, res) {
  try {
    const userId = req.user.id;
    const { chapterId } = req.params;

    const chapter = await chapterModel.findById(chapterId);
    if (!chapter) {
      return res.status(404).json({ message: "Category not found" });
    }

    if (chapter.creator.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized to delete this category" });
    }

    await chapterMessageModel.deleteMany({ chapter: chapterId });
    await chapterModel.findByIdAndDelete(chapterId);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Error in deleteChapter:", err);
    return res.status(500).json({ message: "Failed to delete category" });
  }
}

/**
 * 12. Relationship space ("You + Person") statistics
 */
export async function getYouAndPersonStats(req, res) {
  try {
    const userId = req.user.id;
    const { targetUserId } = req.params;

    // Find direct conversation
    const myMemberships = await conversationMemberModel.find({ user: userId });
    const myConvIds = myMemberships.map((m) => m.conversation);

    const directMember = await conversationMemberModel.findOne({
      conversation: { $in: myConvIds },
      user: targetUserId,
    });

    let conv = null;
    if (directMember) {
      conv = await conversationModel.findOne({
        _id: directMember.conversation,
        type: "direct",
      });
    }

    if (!conv) {
      return res.status(200).json({
        hasHistory: false,
        stats: {
          sharedMedia: 0,
          voiceNotes: 0,
          chaptersCount: 0,
          experiencesCount: 0,
          momentsCount: 0,
          connectedSince: null,
        },
        sharedMilestones: [],
      });
    }

    const [sharedMedia, voiceNotes, chapters, experiences, moments] = await Promise.all([
      messageModel.countDocuments({
        conversation: conv._id,
        type: { $in: ["image", "video"] },
        deletedFor: { $ne: userId },
      }),
      messageModel.countDocuments({
        conversation: conv._id,
        type: "voice",
        deletedFor: { $ne: userId },
      }),
      chapterModel.find({ conversation: conv._id }).sort({ createdAt: 1 }).lean(),
      experienceModel.find({ conversation: conv._id }).sort({ createdAt: 1 }).lean(),
      momentModel.find({ conversation: conv._id }).sort({ createdAt: 1 }).lean(),
    ]);

    // Target profile info
    const targetProfile = await profileModel
      .findOne({ user: targetUserId })
      .populate("user", "firstName lastName email")
      .lean();

    // Check alias
    const alias = await contactIdentityModel
      .findOne({ owner: userId, targetUser: targetUserId })
      .lean();

    // Build Chronological Shared Relationship Timeline
    const milestones = [
      {
        date: conv.createdAt,
        type: "first_conversation",
        icon: "✈️",
        title: "Flight paths crossed",
        description: "Started direct conversation on OnBoard",
      },
    ];

    if (
      targetProfile &&
      targetProfile.boards &&
      targetProfile.boards.some((b) => b.toString() === userId.toString())
    ) {
      milestones.push({
        date: targetProfile.updatedAt || conv.createdAt,
        type: "crew_boarded",
        icon: "👥",
        title: "Boarded into same Crew",
        description: "Mutual Crew passenger boarding confirmed",
      });
    }

    chapters.forEach((ch) => {
      milestones.push({
        date: ch.createdAt,
        type: "chapter_created",
        icon: "🗂",
        title: `Chapter: ${ch.name}`,
        description: ch.description || "Packaged shared conversation memories",
      });
    });

    experiences.forEach((exp) => {
      milestones.push({
        date: exp.createdAt,
        type: "experience_planned",
        icon: "🎉",
        title: `Experience: ${exp.title}`,
        description: `${exp.category.toUpperCase()} • ${exp.locationName || "Outing"}`,
      });
    });

    moments.forEach((m) => {
      milestones.push({
        date: m.createdAt,
        type: "moment_preserved",
        icon: "✨",
        title: `Moment: ${m.title}`,
        description: m.notes || "Preserved living memory",
      });
    });

    milestones.sort((a, b) => new Date(a.date) - new Date(b.date));

    return res.status(200).json({
      hasHistory: true,
      stats: {
        sharedMedia,
        voiceNotes,
        chaptersCount: chapters.length,
        experiencesCount: experiences.length,
        momentsCount: moments.length,
        connectedSince: conv.createdAt,
      },
      sharedMilestones: milestones,
      targetUser: {
        userId: targetUserId,
        name: targetProfile?.user
          ? `${targetProfile.user.firstName} ${targetProfile.user.lastName || ""}`.trim()
          : "User",
        userName: targetProfile?.userName || "user",
        profilePhoto: targetProfile?.profilePhoto || "",
        bio: targetProfile?.bio || "",
        privateNickname: alias?.privateNickname || "",
        privateAvatar: alias?.privateAvatar || "",
        notes: alias?.notes || "",
      },
    });
  } catch (err) {
    console.error("Error in getYouAndPersonStats:", err);
    return res.status(500).json({ message: "Failed to fetch relationship stats" });
  }
}

/**
 * 13. Save / Update Personal Contact Identity ("How I See You")
 */
export async function saveContactIdentity(req, res) {
  try {
    const userId = req.user.id;
    const { targetUserId, privateNickname, privateAvatar, notes } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ message: "targetUserId is required" });
    }

    const updated = await contactIdentityModel.findOneAndUpdate(
      { owner: userId, targetUser: targetUserId },
      {
        privateNickname: privateNickname ? privateNickname.trim() : "",
        privateAvatar: privateAvatar || "",
        notes: notes ? notes.trim() : "",
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({ contactIdentity: updated });
  } catch (err) {
    console.error("Error in saveContactIdentity:", err);
    return res.status(500).json({ message: "Failed to save contact identity" });
  }
}

/**
 * 14. Save / Update Crew Identity (Group persona)
 */
export async function saveCrewIdentity(req, res) {
  try {
    const userId = req.user.id;
    const { crewId, displayName, badge, avatar } = req.body;

    if (!crewId) {
      return res.status(400).json({ message: "crewId is required" });
    }

    const updated = await crewIdentityModel.findOneAndUpdate(
      { crewId, user: userId },
      {
        displayName: displayName ? displayName.trim() : "",
        badge: badge ? badge.trim() : "",
        avatar: avatar || "",
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({ crewIdentity: updated });
  } catch (err) {
    console.error("Error in saveCrewIdentity:", err);
    return res.status(500).json({ message: "Failed to save crew identity" });
  }
}
