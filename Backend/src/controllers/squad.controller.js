import mongoose from "mongoose";
import squadModel from "../models/squad.model.js";
import squadMessageModel from "../models/squadMessage.model.js";
import profileModel from "../models/profile.model.js";
import userModel from "../models/user.model.js";

// Helper: enrich squad with member profiles and caller permissions
async function enrichSquadData(squadDoc, userId) {
  const squad = squadDoc.toObject ? squadDoc.toObject() : squadDoc;
  const memberUserIds = squad.members.map((m) => m.user?.toString() || m.user);

  // Fetch profiles for all members
  const memberProfiles = await profileModel
    .find({ user: { $in: memberUserIds } })
    .lean();

  const profileMap = new Map();
  memberProfiles.forEach((p) => {
    profileMap.set(p.user.toString(), p);
  });

  // Enrich members array
  const enrichedMembers = squad.members.map((m) => {
    const uId = (m.user?._id || m.user).toString();
    const prof = profileMap.get(uId);
    return {
      userId: uId,
      role: m.role,
      joinedAt: m.joinedAt,
      userName: prof?.userName || "crew_member",
      fullName: prof?.fullName || prof?.userName || "Crew Member",
      profilePhoto: prof?.profilePhoto || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
      bio: prof?.bio || "",
      isVerified: !!prof?.isVerified,
    };
  });

  const uIdStr = userId?.toString();
  const callerMember = squad.members.find(
    (m) => (m.user?._id || m.user).toString() === uIdStr
  );
  const isCaptain = squad.captain?.toString() === uIdStr;
  const isCoCaptain = callerMember?.role === "co_captain";
  const isMember = !!callerMember;

  const whoCanChat = squad.settings?.whoCanChat || "all_members";
  const whoCanInvite = squad.settings?.whoCanInvite || "all_members";

  const canChat = isMember && (whoCanChat === "all_members" || isCaptain || isCoCaptain);
  const canInvite = isMember && (whoCanInvite === "all_members" || isCaptain || isCoCaptain);

  // Captain profile info
  const captainProf = profileMap.get(squad.captain?.toString());

  return {
    ...squad,
    members: enrichedMembers,
    membersCount: enrichedMembers.length,
    captainInfo: {
      userId: squad.captain?.toString(),
      userName: captainProf?.userName || "Captain",
      fullName: captainProf?.fullName || captainProf?.userName || "Captain",
      profilePhoto: captainProf?.profilePhoto || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
      isVerified: !!captainProf?.isVerified,
    },
    isCaptain,
    isCoCaptain,
    isMember,
    myRole: isCaptain ? "captain" : callerMember ? callerMember.role : null,
    canChat,
    canInvite,
  };
}

/**
 * 1. Create a new Squad
 */
export async function createSquad(req, res) {
  try {
    const userId = req.user.id || req.user._id;
    const {
      name,
      handle,
      tagline,
      description,
      categoryTags,
      privacy,
      whoCanChat,
      whoCanInvite,
      avatar,
      banner,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Squad name is required" });
    }

    // Auto-generate or clean handle
    let squadHandle = handle
      ? handle.trim().toLowerCase().replace(/[^a-z0-9_]/g, "")
      : name
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, "_")
          .slice(0, 20);

    if (!squadHandle) {
      squadHandle = "squad_" + Math.random().toString(36).substring(2, 7);
    }

    // Ensure handle uniqueness
    let existingSquad = await squadModel.findOne({ handle: squadHandle });
    if (existingSquad) {
      squadHandle = `${squadHandle}_${Math.random().toString(36).substring(2, 6)}`;
    }

    // Clean category tags
    let tags = [];
    if (Array.isArray(categoryTags)) {
      tags = categoryTags.map((t) => t.trim().toLowerCase()).filter(Boolean);
    } else if (typeof categoryTags === "string") {
      tags = categoryTags
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
    }

    const newSquad = await squadModel.create({
      name: name.trim(),
      handle: squadHandle,
      tagline: tagline?.trim() || "",
      description: description?.trim() || "",
      avatar:
        avatar ||
        "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=200&auto=format&fit=crop&q=80",
      banner:
        banner ||
        "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&auto=format&fit=crop&q=80",
      captain: userId,
      members: [
        {
          user: userId,
          role: "captain",
          joinedAt: new Date(),
        },
      ],
      categoryTags: tags,
      privacy: privacy === "invite_only" ? "invite_only" : "public",
      settings: {
        whoCanChat: whoCanChat === "captains_only" ? "captains_only" : "all_members",
        whoCanInvite: whoCanInvite === "captains_only" ? "captains_only" : "all_members",
      },
    });

    const enriched = await enrichSquadData(newSquad, userId);
    return res.status(201).json({ squad: enriched, message: "Squad created successfully!" });
  } catch (err) {
    console.error("Error creating squad:", err);
    return res.status(500).json({ message: "Failed to create squad", error: err.message });
  }
}

/**
 * 2. Get Squads list (with recommendations, search, category, mine)
 */
export async function getSquads(req, res) {
  try {
    const userId = req.user.id || req.user._id;
    const { search, category, filter } = req.query;

    let query = {};

    if (filter === "mine") {
      query["members.user"] = userId;
    } else if (filter === "recommended") {
      // Find user profile to inspect their interests
      const myProfile = await profileModel.findOne({ user: userId }).lean();
      const myInterests = myProfile?.interests || [];
      const myInterestKeys = myProfile?.interestScores
        ? Object.keys(myProfile.interestScores)
        : [];
      const combinedInterests = [...new Set([...myInterests, ...myInterestKeys])].filter(Boolean);

      if (combinedInterests.length > 0) {
        // Recommend public squads matching user's interests where user is not yet a member
        const regexes = combinedInterests.map(
          (interest) => new RegExp(interest.replace(/[^a-zA-Z0-9]/g, ""), "i")
        );
        query = {
          "members.user": { $ne: userId },
          privacy: "public",
          $or: [
            { categoryTags: { $in: regexes } },
            { name: { $in: regexes } },
            { tagline: { $in: regexes } },
            { description: { $in: regexes } },
          ],
        };
      } else {
        // If user has no tags set, recommend popular public squads user hasn't joined
        query = {
          "members.user": { $ne: userId },
          privacy: "public",
        };
      }
    } else {
      // Default / explore: public squads or user's joined squads
      if (category && category !== "all") {
        query.categoryTags = new RegExp(`^${category}$`, "i");
      }
    }

    if (search && search.trim()) {
      const sRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { name: sRegex },
        { handle: sRegex },
        { tagline: sRegex },
        { categoryTags: sRegex },
      ];
    }

    const squads = await squadModel.find(query).sort({ updatedAt: -1 }).limit(40).lean();

    // Collect all captain IDs
    const captainIds = [...new Set(squads.map((s) => s.captain?.toString()).filter(Boolean))];
    const captainProfiles = await profileModel
      .find({ user: { $in: captainIds } })
      .lean();
    const captainMap = new Map();
    captainProfiles.forEach((p) => captainMap.set(p.user.toString(), p));

    const enrichedList = squads.map((s) => {
      const uIdStr = userId.toString();
      const myMemberEntry = s.members.find(
        (m) => (m.user?._id || m.user).toString() === uIdStr
      );
      const isCaptain = s.captain?.toString() === uIdStr;
      const capProf = captainMap.get(s.captain?.toString());

      return {
        _id: s._id,
        name: s.name,
        handle: s.handle,
        tagline: s.tagline,
        description: s.description,
        avatar: s.avatar,
        banner: s.banner,
        categoryTags: s.categoryTags || [],
        privacy: s.privacy,
        membersCount: s.members ? s.members.length : 0,
        isMember: !!myMemberEntry,
        isCaptain,
        myRole: isCaptain ? "captain" : myMemberEntry ? myMemberEntry.role : null,
        captainInfo: {
          userId: s.captain?.toString(),
          userName: capProf?.userName || "Captain",
          profilePhoto: capProf?.profilePhoto || "",
          isVerified: !!capProf?.isVerified,
        },
        settings: s.settings,
        createdAt: s.createdAt,
      };
    });

    return res.status(200).json({ squads: enrichedList });
  } catch (err) {
    console.error("Error fetching squads:", err);
    return res.status(500).json({ message: "Failed to fetch squads", error: err.message });
  }
}

/**
 * 3. Get Squad by ID (full details, member roster, role permissions)
 */
export async function getSquadById(req, res) {
  try {
    const userId = req.user.id || req.user._id;
    const { id } = req.params;

    const squad = await squadModel.findById(id);
    if (!squad) {
      return res.status(404).json({ message: "Squad not found" });
    }

    const enriched = await enrichSquadData(squad, userId);
    return res.status(200).json({ squad: enriched });
  } catch (err) {
    console.error("Error fetching squad details:", err);
    return res.status(500).json({ message: "Failed to fetch squad details", error: err.message });
  }
}

/**
 * 4. Join a Squad
 */
export async function joinSquad(req, res) {
  try {
    const userId = req.user.id || req.user._id;
    const { id } = req.params;

    const squad = await squadModel.findById(id);
    if (!squad) {
      return res.status(404).json({ message: "Squad not found" });
    }

    const isAlreadyMember = squad.members.some(
      (m) => (m.user?._id || m.user).toString() === userId.toString()
    );

    if (isAlreadyMember) {
      return res.status(400).json({ message: "You are already a member of this squad" });
    }

    if (squad.privacy === "invite_only") {
      return res.status(403).json({ message: "This squad is invite-only. A captain or member must invite you." });
    }

    squad.members.push({
      user: userId,
      role: "crew",
      joinedAt: new Date(),
    });

    await squad.save();
    const enriched = await enrichSquadData(squad, userId);
    return res.status(200).json({ squad: enriched, message: "Welcome aboard the squad!" });
  } catch (err) {
    console.error("Error joining squad:", err);
    return res.status(500).json({ message: "Failed to join squad", error: err.message });
  }
}

/**
 * 5. Leave a Squad
 */
export async function leaveSquad(req, res) {
  try {
    const userId = req.user.id || req.user._id;
    const { id } = req.params;

    const squad = await squadModel.findById(id);
    if (!squad) {
      return res.status(404).json({ message: "Squad not found" });
    }

    const isMember = squad.members.some(
      (m) => (m.user?._id || m.user).toString() === userId.toString()
    );

    if (!isMember) {
      return res.status(400).json({ message: "You are not a member of this squad" });
    }

    // If caller is the Captain
    if (squad.captain.toString() === userId.toString()) {
      const remainingMembers = squad.members.filter(
        (m) => (m.user?._id || m.user).toString() !== userId.toString()
      );

      if (remainingMembers.length === 0) {
        // Last member leaves -> delete squad
        await squadModel.findByIdAndDelete(id);
        await squadMessageModel.deleteMany({ squad: id });
        return res.status(200).json({ message: "Squad disbanded as the captain departed.", disbanded: true });
      }

      // Hand over captaincy: prioritize Co-Captains, then earliest joined crew
      const nextCaptainMember =
        remainingMembers.find((m) => m.role === "co_captain") || remainingMembers[0];

      squad.captain = nextCaptainMember.user;
      nextCaptainMember.role = "captain";
      squad.members = remainingMembers;
    } else {
      squad.members = squad.members.filter(
        (m) => (m.user?._id || m.user).toString() !== userId.toString()
      );
    }

    await squad.save();
    return res.status(200).json({ message: "Successfully left the squad" });
  } catch (err) {
    console.error("Error leaving squad:", err);
    return res.status(500).json({ message: "Failed to leave squad", error: err.message });
  }
}

/**
 * 6. Appoint / Update Member Role (Captain only)
 * Promote to co_captain (Sub-Captain) or demote to crew
 */
export async function updateMemberRole(req, res) {
  try {
    const userId = req.user.id || req.user._id;
    const { id } = req.params;
    const { targetUserId, newRole } = req.body;

    if (!["co_captain", "crew"].includes(newRole)) {
      return res.status(400).json({ message: "Invalid role. Role must be 'co_captain' or 'crew'" });
    }

    const squad = await squadModel.findById(id);
    if (!squad) {
      return res.status(404).json({ message: "Squad not found" });
    }

    // Only Captain can appoint or change roles
    if (squad.captain.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only the Squad Captain can appoint or change member roles" });
    }

    if (targetUserId.toString() === userId.toString()) {
      return res.status(400).json({ message: "Captain role cannot be changed through this action" });
    }

    const member = squad.members.find(
      (m) => (m.user?._id || m.user).toString() === targetUserId.toString()
    );

    if (!member) {
      return res.status(404).json({ message: "Target user is not a member of this squad" });
    }

    member.role = newRole;
    await squad.save();

    const enriched = await enrichSquadData(squad, userId);
    return res.status(200).json({
      squad: enriched,
      message: `Role updated to ${newRole === "co_captain" ? "Co-Captain (Sub-Captain)" : "Crew"}`,
    });
  } catch (err) {
    console.error("Error updating member role:", err);
    return res.status(500).json({ message: "Failed to update role", error: err.message });
  }
}

/**
 * 7. Remove Member from Squad (Unboard from Squad)
 * Captain can remove any member; Co-Captain can remove regular crew
 */
export async function removeMember(req, res) {
  try {
    const userId = req.user.id || req.user._id;
    const { id, targetUserId } = req.params;

    const squad = await squadModel.findById(id);
    if (!squad) {
      return res.status(404).json({ message: "Squad not found" });
    }

    const isCaptain = squad.captain.toString() === userId.toString();
    const callerMember = squad.members.find(
      (m) => (m.user?._id || m.user).toString() === userId.toString()
    );
    const isCoCaptain = callerMember?.role === "co_captain";

    if (!isCaptain && !isCoCaptain) {
      return res.status(403).json({ message: "You don't have permission to remove members" });
    }

    const targetMember = squad.members.find(
      (m) => (m.user?._id || m.user).toString() === targetUserId.toString()
    );

    if (!targetMember) {
      return res.status(404).json({ message: "Member not found in squad" });
    }

    // Co-Captains cannot remove Captain or another Co-Captain
    if (!isCaptain && (targetMember.role === "co_captain" || targetMember.role === "captain")) {
      return res.status(403).json({ message: "Co-Captains cannot remove other leaders" });
    }

    squad.members = squad.members.filter(
      (m) => (m.user?._id || m.user).toString() !== targetUserId.toString()
    );

    await squad.save();
    const enriched = await enrichSquadData(squad, userId);
    return res.status(200).json({ squad: enriched, message: "Member unboarded from squad" });
  } catch (err) {
    console.error("Error removing member:", err);
    return res.status(500).json({ message: "Failed to remove member", error: err.message });
  }
}

/**
 * 8. Update Squad Settings (Captain only)
 * Controls what other members can do (whoCanChat, whoCanInvite, tags, details)
 */
export async function updateSquadSettings(req, res) {
  try {
    const userId = req.user.id || req.user._id;
    const { id } = req.params;
    const {
      name,
      tagline,
      description,
      categoryTags,
      privacy,
      whoCanChat,
      whoCanInvite,
      avatar,
      banner,
    } = req.body;

    const squad = await squadModel.findById(id);
    if (!squad) {
      return res.status(404).json({ message: "Squad not found" });
    }

    if (squad.captain.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only the Squad Captain can edit squad settings and permissions" });
    }

    if (name) squad.name = name.trim();
    if (tagline !== undefined) squad.tagline = tagline.trim();
    if (description !== undefined) squad.description = description.trim();
    if (avatar) squad.avatar = avatar;
    if (banner) squad.banner = banner;
    if (privacy) squad.privacy = privacy;

    if (categoryTags) {
      if (Array.isArray(categoryTags)) {
        squad.categoryTags = categoryTags.map((t) => t.trim().toLowerCase()).filter(Boolean);
      } else if (typeof categoryTags === "string") {
        squad.categoryTags = categoryTags
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean);
      }
    }

    if (!squad.settings) squad.settings = {};
    if (whoCanChat) squad.settings.whoCanChat = whoCanChat;
    if (whoCanInvite) squad.settings.whoCanInvite = whoCanInvite;

    await squad.save();
    const enriched = await enrichSquadData(squad, userId);
    return res.status(200).json({ squad: enriched, message: "Squad settings updated successfully" });
  } catch (err) {
    console.error("Error updating squad settings:", err);
    return res.status(500).json({ message: "Failed to update squad settings", error: err.message });
  }
}

/**
 * 9. Invite Members to Squad
 */
export async function inviteMembers(req, res) {
  try {
    const userId = req.user.id || req.user._id;
    const { id } = req.params;
    const { userIds } = req.body; // Array of user IDs

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: "userIds array is required" });
    }

    const squad = await squadModel.findById(id);
    if (!squad) {
      return res.status(404).json({ message: "Squad not found" });
    }

    const isCaptain = squad.captain.toString() === userId.toString();
    const callerMember = squad.members.find(
      (m) => (m.user?._id || m.user).toString() === userId.toString()
    );
    const isCoCaptain = callerMember?.role === "co_captain";

    if (
      squad.settings?.whoCanInvite === "captains_only" &&
      !isCaptain &&
      !isCoCaptain
    ) {
      return res.status(403).json({ message: "Only captains can invite members to this squad" });
    }

    let addedCount = 0;
    userIds.forEach((uId) => {
      const alreadyIn = squad.members.some(
        (m) => (m.user?._id || m.user).toString() === uId.toString()
      );
      if (!alreadyIn) {
        squad.members.push({
          user: uId,
          role: "crew",
          joinedAt: new Date(),
          invitedBy: userId,
        });
        addedCount++;
      }
    });

    if (addedCount > 0) {
      await squad.save();
    }

    const enriched = await enrichSquadData(squad, userId);
    return res.status(200).json({
      squad: enriched,
      message: `Successfully onboarded ${addedCount} member${addedCount === 1 ? "" : "s"}!`,
    });
  } catch (err) {
    console.error("Error inviting members:", err);
    return res.status(500).json({ message: "Failed to invite members", error: err.message });
  }
}

/**
 * 10. Get Squad Group Chat Messages
 */
export async function getSquadMessages(req, res) {
  try {
    const userId = req.user.id || req.user._id;
    const { id } = req.params;

    const squad = await squadModel.findById(id).lean();
    if (!squad) {
      return res.status(404).json({ message: "Squad not found" });
    }

    // Check membership
    const isMember = squad.members.some(
      (m) => (m.user?._id || m.user).toString() === userId.toString()
    );
    if (!isMember && squad.privacy === "invite_only") {
      return res.status(403).json({ message: "You must be a member to view this group chat" });
    }

    const messages = await squadMessageModel
      .find({ squad: id })
      .sort({ createdAt: 1 })
      .limit(150)
      .lean();

    const senderIds = [...new Set(messages.map((m) => m.sender?.toString()).filter(Boolean))];
    const profiles = await profileModel.find({ user: { $in: senderIds } }).lean();
    const profileMap = new Map();
    profiles.forEach((p) => profileMap.set(p.user.toString(), p));

    // Map member roles
    const memberRoleMap = new Map();
    squad.members.forEach((m) => {
      memberRoleMap.set((m.user?._id || m.user).toString(), m.role);
    });

    const enrichedMessages = messages.map((msg) => {
      const sId = msg.sender?.toString();
      const prof = profileMap.get(sId);
      const role = memberRoleMap.get(sId) || "crew";
      const isCaptain = squad.captain?.toString() === sId;

      return {
        _id: msg._id,
        squadId: msg.squad,
        senderId: sId,
        text: msg.text,
        mediaUrl: msg.mediaUrl,
        mediaType: msg.mediaType,
        pinned: msg.pinned,
        reactions: msg.reactions || [],
        createdAt: msg.createdAt,
        isMine: sId === userId.toString(),
        sender: {
          userName: prof?.userName || "User",
          fullName: prof?.fullName || prof?.userName || "User",
          profilePhoto: prof?.profilePhoto || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
          isVerified: !!prof?.isVerified,
          role: isCaptain ? "captain" : role,
        },
      };
    });

    return res.status(200).json({ messages: enrichedMessages });
  } catch (err) {
    console.error("Error fetching squad messages:", err);
    return res.status(500).json({ message: "Failed to fetch messages", error: err.message });
  }
}

/**
 * 11. Send Squad Group Chat Message
 */
export async function sendSquadMessage(req, res) {
  try {
    const userId = req.user.id || req.user._id;
    const { id } = req.params;
    const { text, mediaUrl, mediaType } = req.body;

    if ((!text || !text.trim()) && !mediaUrl) {
      return res.status(400).json({ message: "Message content or media is required" });
    }

    const squad = await squadModel.findById(id).lean();
    if (!squad) {
      return res.status(404).json({ message: "Squad not found" });
    }

    const callerMember = squad.members.find(
      (m) => (m.user?._id || m.user).toString() === userId.toString()
    );

    if (!callerMember) {
      return res.status(403).json({ message: "You must be a member to send messages in this squad" });
    }

    const isCaptain = squad.captain?.toString() === userId.toString();
    const isCoCaptain = callerMember.role === "co_captain";

    // Permission control: whoCanChat
    if (
      squad.settings?.whoCanChat === "captains_only" &&
      !isCaptain &&
      !isCoCaptain
    ) {
      return res.status(403).json({
        message: "Only Captains and Co-Captains have permission to broadcast in this squad chat.",
      });
    }

    const newMsg = await squadMessageModel.create({
      squad: id,
      sender: userId,
      text: text?.trim() || "",
      mediaUrl: mediaUrl || "",
      mediaType: mediaType || "none",
    });

    const prof = await profileModel.findOne({ user: userId }).lean();

    const formatted = {
      _id: newMsg._id,
      squadId: newMsg.squad,
      senderId: userId.toString(),
      text: newMsg.text,
      mediaUrl: newMsg.mediaUrl,
      mediaType: newMsg.mediaType,
      pinned: newMsg.pinned,
      reactions: newMsg.reactions || [],
      createdAt: newMsg.createdAt,
      isMine: true,
      sender: {
        userName: prof?.userName || "User",
        fullName: prof?.fullName || prof?.userName || "User",
        profilePhoto: prof?.profilePhoto || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
        isVerified: !!prof?.isVerified,
        role: isCaptain ? "captain" : callerMember.role,
      },
    };

    return res.status(201).json({ message: formatted });
  } catch (err) {
    console.error("Error sending squad message:", err);
    return res.status(500).json({ message: "Failed to send message", error: err.message });
  }
}
