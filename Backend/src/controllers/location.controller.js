import mongoose from "mongoose";
import locationShareModel from "../models/locationShare.model.js";
import locationShareRecipientModel from "../models/locationShareRecipient.model.js";
import messageModel from "../models/message.model.js";
import conversationModel from "../models/conversation.model.js";
import conversationMemberModel from "../models/conversationMember.model.js";
import profileModel from "../models/profile.model.js";

// Helper: Coordinate boundary validation
function isValidCoordinate(lat, lng) {
  if (typeof lat !== "number" || typeof lng !== "number") return false;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat < -90 || lat > 90) return false;
  if (lng < -180 || lng > 180) return false;
  return true;
}

// Helper: Apply privacy precision
function applyPrecision(val, precision) {
  if (precision === "approximate") {
    // Round to 2 decimal places (~1.1 km radius)
    return Math.round(val * 100) / 100;
  }
  return val;
}

/**
 * 1. Send Current Location (One-time snapshot)
 */
export async function sendCurrentLocation(req, res) {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;
    const {
      clientMessageId,
      latitude,
      longitude,
      accuracy = null,
      precision = "exact",
      label = "",
    } = req.body;

    if (!clientMessageId) {
      return res.status(400).json({ message: "clientMessageId is required" });
    }

    if (!isValidCoordinate(latitude, longitude)) {
      return res.status(400).json({ message: "Invalid geographic coordinates" });
    }

    // Verify conversation membership
    const membership = await conversationMemberModel.findOne({
      conversation: conversationId,
      user: userId,
    });
    if (!membership) {
      return res.status(403).json({ message: "Forbidden: Not a member" });
    }

    const processedLat = applyPrecision(latitude, precision);
    const processedLng = applyPrecision(longitude, precision);

    // Create snapshot LocationShare (status: stopped immediately)
    const locationShare = await locationShareModel.create({
      conversation: conversationId,
      sender: userId,
      type: "current",
      status: "stopped",
      latestLatitude: processedLat,
      latestLongitude: processedLng,
      latestAccuracy: accuracy,
      precision,
      label: label.trim(),
    });

    const previewText = label.trim()
      ? `📍 Location: ${label.trim()}`
      : `📍 Shared Location (${processedLat.toFixed(4)}, ${processedLng.toFixed(4)})`;

    // Create location message
    const message = await messageModel.create({
      conversation: conversationId,
      sender: userId,
      clientMessageId,
      type: "location",
      text: previewText,
      locationShare: locationShare._id,
      locationData: {
        latitude: processedLat,
        longitude: processedLng,
        accuracy,
        label: label.trim(),
      },
    });

    locationShare.message = message._id;
    await locationShare.save();

    // Update conversation lastMessage
    await conversationModel.findByIdAndUpdate(conversationId, {
      lastMessage: {
        text: previewText,
        sender: userId,
        messageType: "location",
        timestamp: message.createdAt,
      },
    });

    // Populate sender info
    const senderProfile = await profileModel.findOne({ user: userId }).lean();
    const enrichedMsg = {
      ...message.toObject(),
      senderName: senderProfile?.userName || "User",
      senderAvatar: senderProfile?.profilePhoto || "",
      locationShare: locationShare.toObject(),
    };

    return res.status(201).json({
      message: enrichedMsg,
      locationShare,
    });
  } catch (err) {
    console.error("Error in sendCurrentLocation:", err);
    return res.status(500).json({ message: "Failed to send current location" });
  }
}

/**
 * 2. Start Live Location Sharing (Temporary moving location)
 */
export async function startLiveLocation(req, res) {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;
    const {
      clientMessageId,
      latitude,
      longitude,
      accuracy = null,
      durationMinutes = 60,
      precision = "exact",
      visibility = "conversation_members",
      selectedMemberIds = [],
      notifyRecipients = false,
      label = "",
    } = req.body;

    if (!clientMessageId) {
      return res.status(400).json({ message: "clientMessageId is required" });
    }

    if (!isValidCoordinate(latitude, longitude)) {
      return res.status(400).json({ message: "Invalid geographic coordinates" });
    }

    // Verify conversation membership
    const membership = await conversationMemberModel.findOne({
      conversation: conversationId,
      user: userId,
    });
    if (!membership) {
      return res.status(403).json({ message: "Forbidden: Not a member" });
    }

    // Hard backend-enforced maximum: 10 days = 14400 minutes
    const MAX_DURATION_MINUTES = 10 * 24 * 60;
    const parsedDuration = parseInt(durationMinutes, 10) || 60;
    const clampedDuration = Math.min(
      Math.max(parsedDuration, 5),
      MAX_DURATION_MINUTES
    );

    const startedAt = new Date();
    const expiresAt = new Date(startedAt.getTime() + clampedDuration * 60 * 1000);

    const processedLat = applyPrecision(latitude, precision);
    const processedLng = applyPrecision(longitude, precision);

    // Create Live LocationShare record
    const locationShare = await locationShareModel.create({
      conversation: conversationId,
      sender: userId,
      type: "live",
      status: "active",
      startedAt,
      expiresAt,
      durationMinutes: clampedDuration,
      latestLatitude: processedLat,
      latestLongitude: processedLng,
      latestAccuracy: accuracy,
      latestUpdatedAt: startedAt,
      precision,
      visibility,
      notifyRecipients,
      label: label.trim(),
    });

    // If visibility is selected members, create recipient junction records
    if (
      visibility === "selected_members" &&
      Array.isArray(selectedMemberIds) &&
      selectedMemberIds.length > 0
    ) {
      const recipientDocs = selectedMemberIds.map((mId) => ({
        locationShare: locationShare._id,
        user: mId,
      }));
      try {
        await locationShareRecipientModel.insertMany(recipientDocs, {
          ordered: false,
        });
      } catch (insertErr) {
        // Ignore duplicate inserts
      }
    }

    const previewText = `🟢 Live Location shared (Ends in ${clampedDuration}m)`;

    // Create live_location message
    const message = await messageModel.create({
      conversation: conversationId,
      sender: userId,
      clientMessageId,
      type: "live_location",
      text: previewText,
      locationShare: locationShare._id,
      locationData: {
        latitude: processedLat,
        longitude: processedLng,
        accuracy,
        label: label.trim(),
      },
    });

    locationShare.message = message._id;
    await locationShare.save();

    // Update conversation lastMessage
    await conversationModel.findByIdAndUpdate(conversationId, {
      lastMessage: {
        text: previewText,
        sender: userId,
        messageType: "live_location",
        timestamp: message.createdAt,
      },
    });

    const senderProfile = await profileModel.findOne({ user: userId }).lean();
    const enrichedMsg = {
      ...message.toObject(),
      senderName: senderProfile?.userName || "User",
      senderAvatar: senderProfile?.profilePhoto || "",
      locationShare: locationShare.toObject(),
    };

    return res.status(201).json({
      message: enrichedMsg,
      locationShare,
    });
  } catch (err) {
    console.error("Error in startLiveLocation:", err);
    return res.status(500).json({ message: "Failed to start live location" });
  }
}

/**
 * 3. Update Moving Live Location (Sender-only, adaptive sync)
 */
export async function updateLiveLocation(req, res) {
  try {
    const userId = req.user.id;
    const { locationShareId } = req.params;
    const { latitude, longitude, accuracy = null } = req.body;

    if (!isValidCoordinate(latitude, longitude)) {
      return res.status(400).json({ message: "Invalid geographic coordinates" });
    }

    const share = await locationShareModel.findById(locationShareId);
    if (!share) {
      return res.status(404).json({ message: "Location share not found" });
    }

    // Verify sender ownership
    if (share.sender.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Forbidden: You do not own this live location share" });
    }

    // Server-side expiration check
    if (share.expiresAt && share.expiresAt <= new Date()) {
      share.status = "expired";
      await share.save();
      return res.status(410).json({
        message: "Live location share has expired",
        status: "expired",
      });
    }

    if (share.status !== "active") {
      return res.status(400).json({
        message: `Cannot update: share is currently ${share.status}`,
        status: share.status,
      });
    }

    const processedLat = applyPrecision(latitude, share.precision);
    const processedLng = applyPrecision(longitude, share.precision);

    share.latestLatitude = processedLat;
    share.latestLongitude = processedLng;
    share.latestAccuracy = accuracy;
    share.latestUpdatedAt = new Date();
    await share.save();

    // Cache latest coordinates in parent message
    if (share.message) {
      await messageModel.findByIdAndUpdate(share.message, {
        "locationData.latitude": processedLat,
        "locationData.longitude": processedLng,
        "locationData.accuracy": accuracy,
      });
    }

    return res.status(200).json({ locationShare: share });
  } catch (err) {
    console.error("Error in updateLiveLocation:", err);
    return res.status(500).json({ message: "Failed to update live location" });
  }
}

/**
 * 4. Stop Live Location Sharing
 */
export async function stopLiveLocation(req, res) {
  try {
    const userId = req.user.id;
    const { locationShareId } = req.params;

    const share = await locationShareModel.findById(locationShareId);
    if (!share) {
      return res.status(404).json({ message: "Location share not found" });
    }

    if (share.sender.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Forbidden: Only the sender can stop sharing" });
    }

    share.status = "stopped";
    await share.save();

    return res.status(200).json({ success: true, status: "stopped", locationShare: share });
  } catch (err) {
    console.error("Error in stopLiveLocation:", err);
    return res.status(500).json({ message: "Failed to stop location sharing" });
  }
}

/**
 * 5. Stop All Active Live Location Shares
 */
export async function stopAllLiveLocations(req, res) {
  try {
    const userId = req.user.id;

    const result = await locationShareModel.updateMany(
      { sender: userId, status: "active" },
      { status: "stopped" }
    );

    return res.status(200).json({
      success: true,
      stoppedCount: result.modifiedCount,
    });
  } catch (err) {
    console.error("Error in stopAllLiveLocations:", err);
    return res
      .status(500)
      .json({ message: "Failed to stop all location shares" });
  }
}

/**
 * 6. Get Active Location Shares (Active Location Sharing Center)
 */
export async function getActiveLocationShares(req, res) {
  try {
    const userId = req.user.id;
    const now = new Date();

    // Expire any outdated shares first
    await locationShareModel.updateMany(
      { expiresAt: { $lte: now }, status: "active" },
      { status: "expired" }
    );

    // Outbound active shares where user is sender
    const outboundShares = await locationShareModel
      .find({ sender: userId, status: "active" })
      .populate("conversation", "title avatar type")
      .sort({ createdAt: -1 })
      .lean();

    // Inbound active shares in conversations user belongs to
    const myMemberships = await conversationMemberModel
      .find({ user: userId })
      .lean();
    const myConvIds = myMemberships.map((m) => m.conversation);

    const potentialInbound = await locationShareModel
      .find({
        conversation: { $in: myConvIds },
        sender: { $ne: userId },
        status: "active",
      })
      .populate("sender", "firstName lastName")
      .populate("conversation", "title avatar type")
      .sort({ createdAt: -1 })
      .lean();

    // Filter inbound shares by recipient authorization
    const authorizedInbound = [];
    for (const share of potentialInbound) {
      if (share.visibility === "conversation_members") {
        authorizedInbound.push(share);
      } else if (share.visibility === "selected_members") {
        const isRecipient = await locationShareRecipientModel.findOne({
          locationShare: share._id,
          user: userId,
        });
        if (isRecipient) {
          authorizedInbound.push(share);
        }
      }
    }

    return res.status(200).json({
      outbound: outboundShares,
      inbound: authorizedInbound,
    });
  } catch (err) {
    console.error("Error in getActiveLocationShares:", err);
    return res
      .status(500)
      .json({ message: "Failed to fetch active location shares" });
  }
}

/**
 * 7. Get Location Details (for map viewing & updates)
 */
export async function getLocationDetails(req, res) {
  try {
    const userId = req.user.id;
    const { locationShareId } = req.params;

    const share = await locationShareModel.findById(locationShareId).lean();
    if (!share) {
      return res.status(404).json({ message: "Location share not found" });
    }

    // Membership check
    const membership = await conversationMemberModel.findOne({
      conversation: share.conversation,
      user: userId,
    });
    if (!membership) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Check expiration dynamically
    let currentStatus = share.status;
    if (
      share.type === "live" &&
      share.expiresAt &&
      new Date(share.expiresAt) <= new Date()
    ) {
      currentStatus = "expired";
      await locationShareModel.findByIdAndUpdate(locationShareId, {
        status: "expired",
      });
    }

    // Sender profile
    const senderProfile = await profileModel
      .findOne({ user: share.sender })
      .populate("user", "firstName lastName")
      .lean();

    return res.status(200).json({
      locationShare: {
        ...share,
        status: currentStatus,
        senderName: senderProfile?.userName || "User",
        senderAvatar: senderProfile?.profilePhoto || "",
      },
    });
  } catch (err) {
    console.error("Error in getLocationDetails:", err);
    return res.status(500).json({ message: "Failed to fetch location details" });
  }
}

/**
 * 8. Save Location to Board / Memory
 */
export async function saveLocationToBoard(req, res) {
  try {
    const userId = req.user.id;
    const { locationShareId } = req.params;

    const share = await locationShareModel.findById(locationShareId);
    if (!share) {
      return res.status(404).json({ message: "Location share not found" });
    }

    share.savedToBoard = true;
    await share.save();

    return res.status(200).json({
      success: true,
      message: "Location saved to Board & Memories",
      locationShare: share,
    });
  } catch (err) {
    console.error("Error in saveLocationToBoard:", err);
    return res.status(500).json({ message: "Failed to save location" });
  }
}
