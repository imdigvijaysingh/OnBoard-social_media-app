import profileModel from '../models/profile.model.js';
import userModel from '../models/user.model.js';
import { postModel } from '../models/post.model.js';
import uploadFile from '../services/storage.service.js';
import { createNotification } from '../services/notification.service.js';

export const OFFICIAL_VERIFIED_BYPASS = {
    emails: ["digvijaypundir915@gmail.com"],
    usernames: ["maharaja2509singh"]
};

export function isUserOfficialVerified(profileDoc, userDoc = null) {
    if (!profileDoc) return false;
    if (profileDoc.isOfficialVerified) return true;

    const userName = profileDoc.userName ? profileDoc.userName.toLowerCase().trim() : "";
    if (userName && OFFICIAL_VERIFIED_BYPASS.usernames.some(u => u.toLowerCase() === userName)) {
        return true;
    }

    let email = "";
    if (userDoc && userDoc.email) {
        email = userDoc.email.toLowerCase().trim();
    } else if (profileDoc.user && typeof profileDoc.user === 'object' && profileDoc.user.email) {
        email = profileDoc.user.email.toLowerCase().trim();
    } else if (profileDoc.contactEmail) {
        email = profileDoc.contactEmail.toLowerCase().trim();
    }

    if (email && OFFICIAL_VERIFIED_BYPASS.emails.some(e => e.toLowerCase() === email)) {
        return true;
    }

    return false;
}

export async function ensureUserProfile(userId) {
    if (!userId) return null;
    let profile = await profileModel.findOne({ user: userId });
    if (profile) return profile;

    const user = await userModel.findById(userId);
    if (!user) return null;

    let baseHandle = '';
    if (user.email) {
        baseHandle = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
    }
    if (!baseHandle || baseHandle.length < 3) {
        baseHandle = `${user.firstName || 'crew'}`.toLowerCase().replace(/[^a-z0-9_]/g, '');
    }
    if (!baseHandle || baseHandle.length < 3) {
        baseHandle = `crew_${userId.toString().slice(-4)}`;
    }

    let candidate = baseHandle;
    let counter = 1;
    while (await profileModel.findOne({ userName: new RegExp(`^${candidate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') })) {
        candidate = `${baseHandle}${counter++}`;
    }

    const defaultAvatar = user.googlePicture || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80";

    profile = await profileModel.create({
        user: user._id,
        userName: candidate,
        profilePhoto: defaultAvatar,
        bio: "Welcome to my OnBoard cabin! ✨",
        contactEmail: user.email || "",
        showEmail: false,
        trustScore: 100,
        communityStanding: "good_standing",
        safetyBadges: ["Verified Crew", "Anti-Spam Guardian", "Clean Record"]
    });

    console.log(`[Auto-Heal] Successfully provisioned profile for user ${user._id} (${user.email}) with username '@${candidate}'`);
    return profile;
}

export async function createProfile(req, res) {
    try {

        if (!req.file) {
            return res.status(400).json({
                message: "Image is required"
            });
        }

        if(!req.body.userName) {
            return res.status(400).json({
                message: "Username is required"
            })
        }

        const result = await uploadFile(req.file.buffer); 

        const { profilePhoto, userName, dob } = req.body;
        const cleanUserName = userName.trim();
        const safeRegex = new RegExp(`^${cleanUserName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');

        const isUserNameAlreadyExists = await profileModel.findOne({
            userName: safeRegex,
            user: { $ne: req.user.id }
        });

        if (isUserNameAlreadyExists) {
            const existingUser = await userModel.findById(isUserNameAlreadyExists.user);
            if (!existingUser) {
                // Orphan profile: delete it immediately so the username is released for anyone to take!
                await profileModel.deleteOne({ _id: isUserNameAlreadyExists._id });
            } else {
                return res.status(409).json({
                    message: "This username is taken. Try a different one.",
                });
            }
        }

        // Update existing profile if already created (e.g. via Google OAuth or prior step)
        let profile = await profileModel.findOne({ user: req.user.id });
        if (profile) {
            const oldUserName = profile.userName;
            profile.profilePhoto = result.url;
            profile.userName = cleanUserName;
            profile.dob = dob;
            await profile.save();
            // Delete any duplicate profiles for this user
            await profileModel.deleteMany({ user: req.user.id, _id: { $ne: profile._id } });
            console.log(`[Profile Setup] Updated profile for user ${req.user.id}. Old username '${oldUserName}' released for new username '${cleanUserName}'.`);
        } else {
            profile = await profileModel.create({
                user: req.user.id,
                profilePhoto: result.url,
                userName: cleanUserName,
                dob
            });
        }

        return res.status(201).json({
            message: "Profile created successfully",
            user: {
                profilePhoto: profile.profilePhoto,
                userName: profile.userName,
                dob: profile.dob
            }
        });

    } catch (err) {
        console.log(err);
        return res.status(500).json({
            message: "Failed to create profile"
        })
    }    
    
}

export async function getMe(req, res) {
    try {
        let userProfile = await profileModel.findOne({ user: req.user.id }).populate('user');
        
        if (!userProfile) {
            userProfile = await ensureUserProfile(req.user.id);
            if (userProfile) {
                userProfile = await profileModel.findById(userProfile._id).populate('user');
            }
        }

        if (!userProfile) {
            return res.status(404).json({
                message: "Profile not found",
            });
        }

        // Find mutual friends (users this user has boarded, who have also boarded this user)
        const allProfiles = await profileModel.find();
        let friendsCount = 0;
        const myBoards = userProfile.boards || [];
        
        myBoards.forEach(boardedId => {
            const boardedProfile = allProfiles.find(p => p.user && p.user.toString() === boardedId?.toString());
            if (boardedProfile && Array.isArray(boardedProfile.boards) && boardedProfile.boards.some(b => b?.toString() === req.user.id.toString())) {
                friendsCount++;
            }
        });

        const postCount = await postModel.countDocuments({ user: req.user.id });

        const name = userProfile.user
            ? `${userProfile.user.firstName || ''} ${userProfile.user.lastName || ""}`.trim()
            : (userProfile.userName || "User");

        let photoHistory = userProfile.photoHistory || [];
        if (photoHistory.length === 0 && userProfile.profilePhoto) {
            photoHistory = [{
                url: userProfile.profilePhoto,
                startedAt: userProfile.createdAt || new Date(),
                endedAt: null
            }];
        }

        const isOfficialVerified = isUserOfficialVerified(userProfile, userProfile.user);
        if (isOfficialVerified && !userProfile.isOfficialVerified) {
            userProfile.isOfficialVerified = true;
            userProfile.officialVerifiedAt = userProfile.officialVerifiedAt || new Date();
            userProfile.save().catch(e => console.error("Auto bypass sync error:", e));
        }

        return res.status(200).json({
            message: "User fetched successfully",
            user: {
                userId: req.user.id,
                profilePhoto: userProfile.profilePhoto,
                userName: userProfile.userName,
                firstName: userProfile.user?.firstName || "",
                lastName: userProfile.user?.lastName || "",
                name,
                dob: userProfile.dob || "",
                gender: userProfile.gender || "",
                pronouns: userProfile.pronouns || "",
                contactEmail: userProfile.contactEmail || (userProfile.user ? userProfile.user.email : ""),
                showEmail: userProfile.showEmail || false,
                contactPhone: userProfile.contactPhone || "",
                showPhone: userProfile.showPhone || false,
                photoHistory,
                postCount,
                friendsCount,
                boards: myBoards,
                bio: userProfile.bio,
                isPrivate: userProfile.isPrivate || false,
                membershipTier: userProfile.membershipTier || "standard",
                cabinTheme: userProfile.cabinTheme || "default",
                vipFlair: userProfile.vipFlair || "",
                communityStanding: userProfile.communityStanding || "good_standing",
                trustScore: userProfile.trustScore !== undefined ? userProfile.trustScore : 100,
                safetyBadges: userProfile.safetyBadges || ["Verified Crew", "Anti-Spam Guardian", "Clean Record"],
                isOfficialVerified,
                officialVerifiedAt: userProfile.officialVerifiedAt || (isOfficialVerified ? new Date() : null),
                blockedUsers: userProfile.blockedUsers || [],
                authProvider: userProfile.user?.authProvider || "local",
                googleId: userProfile.user?.googleId || null,
                googlePicture: userProfile.user?.googlePicture || null,
                cloudBackupEnabled: userProfile.user?.cloudBackupEnabled !== undefined ? userProfile.user.cloudBackupEnabled : true,
            }
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            message: "Failed to fetch profile",
        });
    }

}

export async function getSuggestions(req, res) {
    try {
        const currentUserId = req.user.id;
        const currentUserProfile = await profileModel.findOne({ user: currentUserId });
        const myBoards = (currentUserProfile?.boards || []).map(id => id ? id.toString() : "");
        const myBoardRequests = currentUserProfile?.boardRequests || [];

        const profiles = await profileModel.find({ user: { $ne: currentUserId } })
            .populate('user')
            .limit(10);

        const validProfiles = profiles.filter(p => p.user);

        const formattedProfiles = validProfiles.map(profile => {
            const targetUserId = profile.user?._id?.toString();
            let boardStatus = "none";

            if (myBoards.includes(targetUserId)) {
                boardStatus = "boarded";
            } else if (profile.boardRequests?.some(r => r.user && r.user.toString() === currentUserId)) {
                boardStatus = "requested";
            } else if (myBoardRequests.some(r => r.user && r.user.toString() === targetUserId)) {
                boardStatus = "incoming_request";
            }

            const name = profile.user
                ? `${profile.user.firstName || ""} ${profile.user.lastName || ""}`.trim()
                : "Unknown User";

            return {
                userId: profile.user?._id,
                profilePhoto: profile.profilePhoto,
                userName: profile.userName,
                name: name,
                isOfficialVerified: isUserOfficialVerified(profile, profile.user),
                boardStatus
            };
        });

        return res.status(200).json({
            message: "Suggestions fetched successfully",
            suggestions: formattedProfiles
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            message: "Failed to fetch suggestions",
        });
    }
}

export async function toggleBoard(req, res) {
    try {
        const targetUserId = req.params.id;
        const currentUserId = (req.user?.id || req.user?._id)?.toString();
        const { action } = req.body || {};

        if (targetUserId === currentUserId) {
            return res.status(400).json({ message: "You cannot board yourself" });
        }

        const currentUserProfile = await profileModel.findOne({ user: currentUserId });
        const targetUserProfile = await profileModel.findOne({ user: targetUserId });
        
        if (!currentUserProfile || !targetUserProfile) {
            return res.status(404).json({ message: "Profile not found" });
        }

        const isBoarded = currentUserProfile.boards.some(id => id && id.toString() === targetUserId);

        // Explicit action handling
        if (action === "request") {
            if (isBoarded) {
                return res.status(200).json({ message: "Already boarded", status: "boarded" });
            }

            const pendingReqFromTarget = currentUserProfile.boardRequests.find(r => r.user && r.user.toString() === targetUserId);
            if (pendingReqFromTarget) {
                currentUserProfile.boardRequests = currentUserProfile.boardRequests.filter(r => r.user && r.user.toString() !== targetUserId);
                currentUserProfile.boards.push(targetUserId);
                targetUserProfile.boards.push(currentUserId);
                await currentUserProfile.save();
                await targetUserProfile.save();
                return res.status(200).json({ message: "Request accepted", status: "boarded" });
            }

            const existingReqToTarget = targetUserProfile.boardRequests.find(r => r.user && r.user.toString() === currentUserId);
            if (!existingReqToTarget) {
                targetUserProfile.boardRequests.push({ user: currentUserId });
                await targetUserProfile.save();

                createNotification({
                    recipient: targetUserId,
                    actor: currentUserId,
                    type: "BOARDING_REQUEST",
                    category: "crews",
                    priority: "high",
                    title: "Boarding Request",
                    body: "wants to board your Crew.",
                    entityType: "user",
                    entityId: currentUserId,
                    deepLink: `/profile/${currentUserId}`,
                    actionType: "accept_decline_board",
                    sourceEventId: `boarding:${currentUserId}`,
                }).catch(e => console.error("Board req notif error:", e));
            }

            return res.status(200).json({ message: "Request sent", status: "requested" });
        }

        if (action === "cancel") {
            targetUserProfile.boardRequests = targetUserProfile.boardRequests.filter(r => r.user && r.user.toString() !== currentUserId);
            await targetUserProfile.save();
            return res.status(200).json({ message: "Request cancelled", status: "cancelled" });
        }

        if (action === "unboard") {
            currentUserProfile.boards = currentUserProfile.boards.filter(id => id && id.toString() !== targetUserId);
            targetUserProfile.boards = targetUserProfile.boards.filter(id => id && id.toString() !== currentUserId);
            await currentUserProfile.save();
            await targetUserProfile.save();
            return res.status(200).json({ message: "User unboarded", status: "unboarded" });
        }

        // Fallback default toggle behavior
        if (isBoarded) {
            // Unboard: remove from both boards
            currentUserProfile.boards = currentUserProfile.boards.filter(id => id && id.toString() !== targetUserId);
            targetUserProfile.boards = targetUserProfile.boards.filter(id => id && id.toString() !== currentUserId);
            await currentUserProfile.save();
            await targetUserProfile.save();
            return res.status(200).json({ message: "User unboarded", status: "unboarded" });
        } else {
            // Check if target already requested current user
            const pendingReqFromTarget = currentUserProfile.boardRequests.find(r => r.user && r.user.toString() === targetUserId);
            
            if (pendingReqFromTarget) {
                // Auto accept
                currentUserProfile.boardRequests = currentUserProfile.boardRequests.filter(r => r.user && r.user.toString() !== targetUserId);
                currentUserProfile.boards.push(targetUserId);
                targetUserProfile.boards.push(currentUserId);
                await currentUserProfile.save();
                await targetUserProfile.save();
                return res.status(200).json({ message: "Request accepted", status: "boarded" });
            }
            
            // Check if we already requested target
            const existingReqToTarget = targetUserProfile.boardRequests.find(r => r.user && r.user.toString() === currentUserId);
            
            if (existingReqToTarget) {
                // Cancel request
                targetUserProfile.boardRequests = targetUserProfile.boardRequests.filter(r => r.user && r.user.toString() !== currentUserId);
                await targetUserProfile.save();
                return res.status(200).json({ message: "Request cancelled", status: "cancelled" });
            } else {
                // Send request
                targetUserProfile.boardRequests.push({ user: currentUserId });
                await targetUserProfile.save();

                // Trigger boarding request notification
                createNotification({
                    recipient: targetUserId,
                    actor: currentUserId,
                    type: "BOARDING_REQUEST",
                    category: "crews",
                    priority: "high",
                    title: "Boarding Request",
                    body: "wants to board your Crew.",
                    entityType: "user",
                    entityId: currentUserId,
                    deepLink: `/profile/${currentUserId}`,
                    actionType: "accept_decline_board",
                    sourceEventId: `boarding:${currentUserId}`,
                }).catch(e => console.error("Board req notif error:", e));

                return res.status(200).json({ message: "Request sent", status: "requested" });
            }
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to toggle board status" });
    }
}

// Helper: Send birthday notification to all boarded crew members
export async function sendBirthdayAlertsToCrew(profile, user, isTest = false) {
    if (!profile) return 0;
    const name = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : (profile.userName || "Your crew member");
    const pronounWord = profile.gender === "female" ? "her" : profile.gender === "male" ? "him" : "them";

    let count = 0;
    const currentYear = new Date().getFullYear();

    // Collect all crew connections (people this profile boards + people who boarded this profile)
    const crewSet = new Set();
    (profile.boards || []).forEach(bId => {
        if (bId) crewSet.add(bId.toString());
    });

    try {
        const followers = await profileModel.find({ boards: profile.user }).select('user');
        followers.forEach(f => {
            if (f.user) crewSet.add(f.user.toString());
        });
    } catch (e) {
        console.warn("Could not query followers for birthday alert:", e);
    }

    // Do not notify self in the crew loop
    if (profile.user) {
        crewSet.delete(profile.user.toString());
    }

    for (const boardedUserId of crewSet) {
        try {
            await createNotification({
                recipient: boardedUserId,
                actor: profile.user,
                type: "CREW_BIRTHDAY",
                category: "crews",
                priority: "high",
                title: "🎂 Crew Member Birthday Alert!",
                body: `It's ${name}'s birthday in the next 3 hours! Are you ready to wish ${pronounWord}? 🎉`,
                entityType: "user",
                entityId: profile.user,
                deepLink: `/profile/${profile.userName || profile.user}`,
                sourceEventId: `birthday_${profile.user}_${boardedUserId}_${currentYear}${isTest ? '_' + Date.now() : ''}`,
                actionType: "open_profile",
                metadata: {
                    birthdayUserId: profile.user,
                    userName: profile.userName,
                    name
                }
            });
            count++;
        } catch (e) {
            console.error("Failed to notify crew member of birthday:", e);
        }
    }

    // If it's a test trigger from settings, ALSO deliver a preview notification to the current user
    if (isTest && profile.user) {
        try {
            await createNotification({
                recipient: profile.user,
                actor: null, // null actor bypasses self-action check
                type: "CREW_BIRTHDAY",
                category: "crews",
                priority: "high",
                title: "🎂 Birthday Alert Activated!",
                body: `Your birthday celebration alert preview: "It's ${name}'s birthday in the next 3 hours! Are you ready to wish ${pronounWord}? 🎉"${count > 0 ? ` (sent to ${count} crew members)` : ''}`,
                entityType: "user",
                entityId: profile.user,
                deepLink: `/profile/${profile.userName || profile.user}`,
                sourceEventId: `birthday_test_preview_${profile.user}_${Date.now()}`,
                actionType: "open_profile",
                metadata: {
                    birthdayUserId: profile.user,
                    userName: profile.userName,
                    name,
                    isTestPreview: true
                }
            });
            count++;
        } catch (e) {
            console.error("Failed to create self birthday test notification:", e);
        }
    }

    return count;
}

// POST /api/profile/birthday-alerts
export async function triggerBirthdayAlerts(req, res) {
    try {
        const currentUserId = req.user.id || req.user._id;
        const profile = await profileModel.findOne({ user: currentUserId });
        const user = await userModel.findById(currentUserId);

        if (!profile || !user) {
            return res.status(404).json({ message: "Profile not found" });
        }

        const notifiedCount = await sendBirthdayAlertsToCrew(profile, user, true);

        return res.status(200).json({
            message: `Birthday alert sent! Notified ${notifiedCount} crew member${notifiedCount === 1 ? '' : 's'} (and preview added to your notifications). 🎂`,
            notifiedCount
        });
    } catch (err) {
        console.error("triggerBirthdayAlerts error:", err);
        return res.status(500).json({ message: "Failed to trigger birthday alerts" });
    }
}

// GET /api/profile/check-username/:username
export async function checkUsernameAvailability(req, res) {
    try {
        const { username } = req.params;
        const currentUserId = req.user?.id || req.user?._id;

        if (!username || username.trim().length < 3) {
            return res.status(200).json({ available: false, message: "Username must be at least 3 characters" });
        }

        const cleanUserName = username.trim();
        const safeRegex = new RegExp(`^${cleanUserName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
        const query = {
            userName: safeRegex,
        };
        if (currentUserId) {
            query.user = { $ne: currentUserId };
        }

        const existing = await profileModel.findOne(query);

        if (existing) {
            // Check if existing profile is an orphan (user deleted from users collection)
            const existingUser = await userModel.findById(existing.user);
            if (!existingUser) {
                // Orphan profile: delete it immediately so the username is released for anyone to take!
                await profileModel.deleteOne({ _id: existing._id });
                return res.status(200).json({ available: true, message: "Username is available!" });
            }
            return res.status(200).json({ available: false, message: "This username is already taken" });
        }

        return res.status(200).json({ available: true, message: "Username is available!" });
    } catch (err) {
        console.error("checkUsernameAvailability error:", err);
        return res.status(500).json({ available: false, message: "Failed to check username" });
    }
}

// PUT /api/profile/update
export async function updateProfile(req, res) {
    try {
        const currentUserId = req.user.id;
        let profile = await profileModel.findOne({ user: currentUserId });
        let user = await userModel.findById(currentUserId);

        if (!profile && user) {
            profile = await ensureUserProfile(currentUserId);
        }

        if (!profile || !user) {
            return res.status(404).json({ message: "Profile not found" });
        }

        const {
            firstName,
            lastName,
            userName,
            bio,
            gender,
            pronouns,
            dob,
            contactEmail,
            showEmail,
            contactPhone,
            showPhone,
            isPrivate
        } = req.body;

        // 1. Update Name on User model
        if (firstName !== undefined && firstName.trim()) user.firstName = firstName.trim();
        if (lastName !== undefined) user.lastName = lastName.trim();
        await user.save();

        // 2. Update Username on Profile (ensure uniqueness across all other users and release old username)
        if (userName && userName.trim() && userName.trim() !== profile.userName) {
            const cleanUserName = userName.trim();
            const safeRegex = new RegExp(`^${cleanUserName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
            const existing = await profileModel.findOne({
                userName: safeRegex,
                user: { $ne: currentUserId }
            });
            if (existing) {
                const existingUser = await userModel.findById(existing.user);
                if (!existingUser) {
                    // Orphan profile: delete it immediately and allow the new username
                    await profileModel.deleteOne({ _id: existing._id });
                } else {
                    return res.status(409).json({ message: "This username is already taken. Please choose another." });
                }
            }

            const oldUserName = profile.userName;
            profile.userName = cleanUserName;
            console.log(`[Username Update] User ${currentUserId} changed handle from '${oldUserName}' to '${cleanUserName}'. Old handle is now completely released.`);

            // Delete any duplicate profiles for this user
            await profileModel.deleteMany({ user: currentUserId, _id: { $ne: profile._id } });
        }

        // 3. Update bio, gender, pronouns, dob
        if (bio !== undefined) profile.bio = bio;
        if (gender !== undefined) profile.gender = gender;
        if (pronouns !== undefined) profile.pronouns = pronouns;
        if (dob !== undefined) profile.dob = dob;

        // 4. Update contact details
        if (contactEmail !== undefined) profile.contactEmail = contactEmail.trim();
        if (showEmail !== undefined) profile.showEmail = showEmail === true || showEmail === 'true';
        if (contactPhone !== undefined) profile.contactPhone = contactPhone.trim();
        if (showPhone !== undefined) profile.showPhone = showPhone === true || showPhone === 'true';
        if (isPrivate !== undefined) profile.isPrivate = isPrivate === true || isPrivate === 'true';

        // 5. Update Profile Photo & record Photo History
        if (req.file) {
            const uploadResult = await uploadFile(req.file.buffer);
            const newPhotoUrl = uploadResult.url;

            if (!profile.photoHistory) {
                profile.photoHistory = [];
            }

            // End active photo entry if exists
            const currentActive = profile.photoHistory.find(ph => ph.endedAt === null);
            if (currentActive) {
                currentActive.endedAt = new Date();
            } else if (profile.profilePhoto) {
                profile.photoHistory.push({
                    url: profile.profilePhoto,
                    startedAt: profile.createdAt || new Date(Date.now() - 86400000),
                    endedAt: new Date()
                });
            }

            // Append new active photo
            profile.photoHistory.push({
                url: newPhotoUrl,
                startedAt: new Date(),
                endedAt: null
            });

            profile.profilePhoto = newPhotoUrl;
        }

        await profile.save();

        // Optional: trigger birthday alert if requested
        if (req.body.triggerBirthdayAlert === 'true' || req.body.triggerBirthdayAlert === true) {
            await sendBirthdayAlertsToCrew(profile, user);
        }

        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();

        return res.status(200).json({
            message: "Profile updated successfully",
            user: {
                userId: currentUserId,
                profilePhoto: profile.profilePhoto,
                userName: profile.userName,
                firstName: user.firstName,
                lastName: user.lastName,
                name: fullName,
                bio: profile.bio,
                dob: profile.dob,
                gender: profile.gender,
                pronouns: profile.pronouns,
                contactEmail: profile.contactEmail,
                showEmail: profile.showEmail,
                contactPhone: profile.contactPhone,
                showPhone: profile.showPhone,
                photoHistory: profile.photoHistory,
                isPrivate: profile.isPrivate
            }
        });
    } catch (err) {
        console.error("updateProfile error:", err);
        return res.status(500).json({ message: "Failed to update profile", error: err.message });
    }
}

export async function updateBio(req, res) {
    try {
        const { bio } = req.body;
        
        if (typeof bio !== 'string') {
            return res.status(400).json({ message: "Invalid bio format" });
        }

        const profile = await profileModel.findOne({ user: req.user.id });
        if (!profile) {
            return res.status(404).json({ message: "Profile not found" });
        }

        profile.bio = bio;
        await profile.save();

        return res.status(200).json({
            message: "Bio updated successfully",
            bio: profile.bio
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to update bio" });
    }
}

export async function getNotifications(req, res) {
    try {
        const profile = await profileModel.findOne({ user: req.user.id }).populate({
            path: 'boardRequests.user',
            select: 'firstName lastName _id'
        });
        
        if (!profile) return res.status(404).json({ message: "Profile not found" });

        // Populate profile details for requesters
        const requestsWithProfiles = await Promise.all(profile.boardRequests.map(async reqObj => {
            const reqProfile = await profileModel.findOne({ user: reqObj.user._id });
            return {
                userId: reqObj.user._id,
                name: `${reqObj.user.firstName} ${reqObj.user.lastName || ''}`.trim(),
                userName: reqProfile?.userName,
                profilePhoto: reqProfile?.profilePhoto,
                createdAt: reqObj.createdAt
            };
        }));

        return res.status(200).json({ requests: requestsWithProfiles });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to fetch notifications" });
    }
}

export async function acceptRequest(req, res) {
    try {
        const targetUserId = req.params.id;
        const currentUserId = req.user.id;

        const currentUserProfile = await profileModel.findOne({ user: currentUserId });
        const targetUserProfile = await profileModel.findOne({ user: targetUserId });

        if (!currentUserProfile || !targetUserProfile) return res.status(404).json({ message: "Profile not found" });

        // Remove from requests
        currentUserProfile.boardRequests = currentUserProfile.boardRequests.filter(r => r.user.toString() !== targetUserId);
        
        // Add to both boards
        if (!currentUserProfile.boards.includes(targetUserId)) currentUserProfile.boards.push(targetUserId);
        if (!targetUserProfile.boards.includes(currentUserId)) targetUserProfile.boards.push(currentUserId);

        await currentUserProfile.save();
        await targetUserProfile.save();

        // Trigger boarding accepted notification
        createNotification({
            recipient: targetUserId,
            actor: currentUserId,
            type: "BOARDING_ACCEPTED",
            category: "crews",
            priority: "high",
            title: "Boarding Request Accepted",
            body: "accepted your boarding request! You are now Crew.",
            entityType: "user",
            entityId: currentUserId,
            deepLink: `/profile/${currentUserId}`,
            sourceEventId: `boarding_acc:${currentUserId}`,
        }).catch(e => console.error("Board accept notif error:", e));

        return res.status(200).json({ message: "Request accepted" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to accept request" });
    }
}

export async function rejectRequest(req, res) {
    try {
        const targetUserId = req.params.id;
        const currentUserId = req.user.id;

        const currentUserProfile = await profileModel.findOne({ user: currentUserId });
        if (!currentUserProfile) return res.status(404).json({ message: "Profile not found" });

        currentUserProfile.boardRequests = currentUserProfile.boardRequests.filter(r => r.user.toString() !== targetUserId);
        await currentUserProfile.save();

        return res.status(200).json({ message: "Request rejected" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to reject request" });
    }
}

export async function searchUsers(req, res) {
    try {
        const query = req.query.q || req.query.query || "";
        const cleanQuery = query.trim();
        const currentUserId = req.user.id;

        const currentUserProfile = await profileModel.findOne({ user: currentUserId });
        const myBoards = currentUserProfile?.boards || [];
        const myBoardRequests = currentUserProfile?.boardRequests || [];

        // If query is empty, return discovery / suggested crew members
        if (!cleanQuery) {
            const suggestedProfiles = await profileModel.find({ user: { $ne: currentUserId } })
                .populate('user')
                .limit(12);

            const users = await Promise.all(suggestedProfiles.map(async (p) => {
                const targetUserId = p.user?._id?.toString();
                let boardStatus = "none";

                if (myBoards.some(id => id.toString() === targetUserId)) {
                    boardStatus = "boarded";
                } else if (p.boardRequests?.some(r => r.user?.toString() === currentUserId)) {
                    boardStatus = "requested";
                } else if (myBoardRequests.some(r => r.user?.toString() === targetUserId)) {
                    boardStatus = "incoming_request";
                }

                const mutualCount = (p.boards || []).filter(id => myBoards.some(mId => mId.toString() === id.toString())).length;
                const postCount = await postModel.countDocuments({ user: p.user?._id });

                return {
                    userId: p.user?._id,
                    userName: p.userName,
                    name: p.user ? `${p.user.firstName || ''} ${p.user.lastName || ''}`.trim() : "Crew Member",
                    profilePhoto: p.profilePhoto || "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                    bio: p.bio || "",
                    isPrivate: p.isPrivate || false,
                    boardStatus,
                    mutualCount,
                    postCount
                };
            }));

            return res.status(200).json({
                success: true,
                count: users.length,
                users
            });
        }

        const safeRegex = new RegExp(cleanQuery.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), "i");

        // 1. Find user accounts matching firstName or lastName
        const matchingUsers = await userModel.find({
            _id: { $ne: currentUserId },
            $or: [
                { firstName: safeRegex },
                { lastName: safeRegex }
            ]
        }).select('_id');

        const matchingUserIds = matchingUsers.map(u => u._id);

        // 2. Find profiles matching username, bio, or matched user accounts
        const matchedProfiles = await profileModel.find({
            user: { $ne: currentUserId },
            $or: [
                { userName: safeRegex },
                { bio: safeRegex },
                { user: { $in: matchingUserIds } }
            ]
        }).populate('user').limit(25);

        // 3. Transform profiles with connection status and counts
        const users = await Promise.all(matchedProfiles.map(async (p) => {
            const targetUserId = p.user?._id?.toString();
            let boardStatus = "none";

            if (myBoards.some(id => id.toString() === targetUserId)) {
                boardStatus = "boarded";
            } else if (p.boardRequests?.some(r => r.user?.toString() === currentUserId)) {
                boardStatus = "requested";
            } else if (myBoardRequests.some(r => r.user?.toString() === targetUserId)) {
                boardStatus = "incoming_request";
            }

            const mutualCount = (p.boards || []).filter(id => myBoards.some(mId => mId.toString() === id.toString())).length;
            const postCount = await postModel.countDocuments({ user: p.user?._id });

            return {
                userId: p.user?._id,
                userName: p.userName,
                name: p.user ? `${p.user.firstName || ''} ${p.user.lastName || ''}`.trim() : "Crew Member",
                profilePhoto: p.profilePhoto || "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                bio: p.bio || "",
                isPrivate: p.isPrivate || false,
                isOfficialVerified: isUserOfficialVerified(p, p.user),
                boardStatus,
                mutualCount,
                postCount
            };
        }));

        return res.status(200).json({
            success: true,
            count: users.length,
            users
        });
    } catch (err) {
        console.error("searchUsers error:", err);
        return res.status(500).json({
            success: false,
            message: "Failed to search users"
        });
    }
}

export async function getUserProfile(req, res) {
    try {
        const targetIdentifier = req.params.id;
        const currentUserId = req.user.id;

        // Find target profile by user ObjectId, profile ObjectId, or userName
        let targetProfile = null;
        if (targetIdentifier.match(/^[0-9a-fA-F]{24}$/)) {
            targetProfile = await profileModel.findOne({ user: targetIdentifier }).populate('user');
            if (!targetProfile) {
                targetProfile = await profileModel.findById(targetIdentifier).populate('user');
            }
        }
        if (!targetProfile) {
            targetProfile = await profileModel.findOne({ userName: targetIdentifier }).populate('user');
        }

        if (!targetProfile || !targetProfile.user) {
            return res.status(404).json({ message: "Crew profile not found" });
        }

        const actualTargetUserId = targetProfile.user._id.toString();
        const isSelf = actualTargetUserId === currentUserId;

        // Current user profile
        const currentUserProfile = await profileModel.findOne({ user: currentUserId });
        const myBoards = currentUserProfile?.boards || [];
        const myBoardRequests = currentUserProfile?.boardRequests || [];

        // Determine boarding status
        let boardStatus = "none";
        if (myBoards.some(id => id.toString() === actualTargetUserId)) {
            boardStatus = "boarded";
        } else if (targetProfile.boardRequests?.some(r => r.user?.toString() === currentUserId)) {
            boardStatus = "requested";
        } else if (myBoardRequests.some(r => r.user?.toString() === actualTargetUserId)) {
            boardStatus = "incoming_request";
        }

        // Mutual crew connections
        const mutualBoards = (targetProfile.boards || []).filter(bId => 
            myBoards.some(mId => mId.toString() === bId.toString())
        );
        const mutualCount = mutualBoards.length;

        // Total post count
        const totalPostsCount = await postModel.countDocuments({ user: actualTargetUserId });

        // Privacy rules:
        // If isPrivate is true, non-boarded visitors can see bio & profile info, but NOT posts.
        const isPrivate = targetProfile.isPrivate || false;
        const isBoarded = boardStatus === "boarded";
        const canViewPosts = isSelf || !isPrivate || isBoarded;

        let posts = [];
        if (canViewPosts) {
            posts = await postModel.find({ user: actualTargetUserId }).sort({ isPinned: -1, createdAt: -1 });
        }

        const name = targetProfile.user
            ? `${targetProfile.user.firstName || ''} ${targetProfile.user.lastName || ''}`.trim()
            : "Crew Member";

        const isOfficialVerified = isUserOfficialVerified(targetProfile, targetProfile.user);
        if (isOfficialVerified && !targetProfile.isOfficialVerified) {
            targetProfile.isOfficialVerified = true;
            targetProfile.officialVerifiedAt = targetProfile.officialVerifiedAt || new Date();
            targetProfile.save().catch(e => console.error("Auto target bypass sync error:", e));
        }

        return res.status(200).json({
            success: true,
            user: {
                userId: actualTargetUserId,
                profileId: targetProfile._id,
                userName: targetProfile.userName,
                name,
                profilePhoto: targetProfile.profilePhoto || "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                bio: targetProfile.bio || "",
                dob: targetProfile.dob || "",
                gender: targetProfile.gender || "",
                pronouns: targetProfile.pronouns || "",
                contactEmail: targetProfile.showEmail ? targetProfile.contactEmail : null,
                contactPhone: targetProfile.showPhone ? targetProfile.contactPhone : null,
                showEmail: targetProfile.showEmail || false,
                showPhone: targetProfile.showPhone || false,
                photoHistory: isSelf ? (targetProfile.photoHistory || []) : undefined,
                isPrivate,
                isLocked: !canViewPosts,
                boardStatus,
                isSelf,
                mutualCount,
                friendsCount: (targetProfile.boards || []).length,
                postCount: totalPostsCount,
                membershipTier: targetProfile.membershipTier || "standard",
                cabinTheme: targetProfile.cabinTheme || "default",
                vipFlair: targetProfile.vipFlair || "",
                communityStanding: targetProfile.communityStanding || "good_standing",
                trustScore: targetProfile.trustScore !== undefined ? targetProfile.trustScore : 100,
                safetyBadges: targetProfile.safetyBadges || ["Verified Crew", "Anti-Spam Guardian", "Clean Record"],
                isOfficialVerified,
                officialVerifiedAt: targetProfile.officialVerifiedAt || (isOfficialVerified ? new Date() : null),
                isBlocked: (currentUserProfile?.blockedUsers || []).some(id => id.toString() === actualTargetUserId),
                posts
            }
        });
    } catch (err) {
        console.error("getUserProfile error:", err);
        return res.status(500).json({ message: "Failed to fetch crew profile" });
    }
}

export async function togglePrivacy(req, res) {
    try {
        const userId = req.user?.id || req.user?._id;
        if (!userId) {
            return res.status(401).json({ message: "User not authenticated" });
        }

        const currentProfile = await profileModel.findOne({ user: userId });
        if (!currentProfile) {
            return res.status(404).json({ message: "Profile not found" });
        }

        const targetPrivacy = req.body.isPrivate !== undefined 
            ? Boolean(req.body.isPrivate) 
            : !currentProfile.isPrivate;

        const updated = await profileModel.findOneAndUpdate(
            { user: userId },
            { $set: { isPrivate: targetPrivacy } },
            { new: true }
        );

        return res.status(200).json({
            message: `Profile is now ${updated.isPrivate ? "Private" : "Public"}`,
            isPrivate: updated.isPrivate
        });
    } catch (err) {
        console.error("togglePrivacy error:", err);
        return res.status(500).json({ message: "Failed to update profile privacy", error: err.message });
    }
}

export async function updateMembership(req, res) {
    try {
        const userId = req.user.id;
        const { membershipTier, cabinTheme, vipFlair } = req.body;

        const validTiers = ["standard", "creator_pro", "gold_vip", "diamond"];
        const validThemes = ["default", "gold", "violet", "cyan", "rose", "emerald"];

        const profile = await profileModel.findOne({ user: userId });
        if (!profile) {
            return res.status(404).json({ message: "Profile not found" });
        }

        if (membershipTier !== undefined) {
            if (!validTiers.includes(membershipTier)) {
                return res.status(400).json({ message: `Invalid membership tier. Valid: ${validTiers.join(", ")}` });
            }
            profile.membershipTier = membershipTier;
        }

        if (cabinTheme !== undefined) {
            if (!validThemes.includes(cabinTheme)) {
                return res.status(400).json({ message: `Invalid cabin theme. Valid: ${validThemes.join(", ")}` });
            }
            profile.cabinTheme = cabinTheme;
        }

        if (vipFlair !== undefined) {
            profile.vipFlair = typeof vipFlair === 'string' ? vipFlair.trim().slice(0, 40) : "";
        }

        await profile.save();

        if (membershipTier && membershipTier !== "standard") {
            const tierNames = {
                creator_pro: "🚀 Creator Pro",
                gold_vip: "👑 Gold VIP",
                diamond: "💎 Diamond Supporter (First Class)"
            };
            createNotification({
                recipient: userId,
                actor: userId,
                type: "SYSTEM_ANNOUNCEMENT",
                category: "system",
                priority: "high",
                title: "👑 Supporter Membership Active!",
                body: `You are now rocking ${tierNames[membershipTier] || membershipTier}! Enjoy exclusive badges, cabin themes, and creator perks.`,
                entityType: "user",
                entityId: userId,
                deepLink: "/my-profile",
            }).catch(e => console.error("Perk notif error:", e));
        }

        return res.status(200).json({
            message: "Membership & creator perks updated successfully!",
            membershipTier: profile.membershipTier,
            cabinTheme: profile.cabinTheme,
            vipFlair: profile.vipFlair,
        });
    } catch (err) {
        console.error("updateMembership error:", err);
        return res.status(500).json({ message: "Failed to update membership perks", error: err.message });
    }
}

export async function subscribeTick(req, res) {
    try {
        const userId = req.user?.id || req.user?._id;
        if (!userId) {
            return res.status(401).json({ message: "User not authenticated" });
        }

        let profile = await profileModel.findOne({ user: userId }).populate('user');
        if (!profile) {
            profile = await ensureUserProfile(userId);
            if (profile) profile = await profileModel.findById(profile._id).populate('user');
        }
        if (!profile) {
            return res.status(404).json({ message: "Profile not found" });
        }

        const isBypassed = isUserOfficialVerified(profile, profile.user);

        if (profile.isOfficialVerified || isBypassed) {
            profile.isOfficialVerified = true;
            profile.officialVerifiedAt = profile.officialVerifiedAt || new Date();
            await profile.save();
            return res.status(200).json({
                message: isBypassed 
                    ? "Official Verified Tick active via VIP creator pass!" 
                    : "You already have the Official Verified Tick active!",
                isOfficialVerified: true,
                officialVerifiedAt: profile.officialVerifiedAt
            });
        }

        profile.isOfficialVerified = true;
        profile.officialVerifiedAt = new Date();
        await profile.save();

        createNotification({
            recipient: userId,
            actor: userId,
            type: "SYSTEM_ANNOUNCEMENT",
            category: "system",
            priority: "high",
            title: "✨ Official Verified Tick Activated!",
            body: "Congratulations! Your Official Blue Tick is now active across your profile, posts, comments, and search results.",
            entityType: "user",
            entityId: userId,
            deepLink: "/my-profile",
        }).catch(e => console.error("Verified notif error:", e));

        return res.status(200).json({
            message: "Official Verified Tick activated successfully!",
            isOfficialVerified: true,
            officialVerifiedAt: profile.officialVerifiedAt
        });
    } catch (err) {
        console.error("subscribeTick error:", err);
        return res.status(500).json({ message: "Failed to activate official tick", error: err.message });
    }
}

export async function getBoardedCrew(req, res) {
    try {
        const userId = req.user.id;
        let profile = await profileModel.findOne({ user: userId });
        if (!profile) {
            profile = await ensureUserProfile(userId);
        }
        if (!profile) {
            return res.status(200).json({ crew: [] });
        }

        const myBoards = profile.boards || [];
        if (myBoards.length === 0) {
            return res.status(200).json({ crew: [] });
        }

        const crewProfiles = await profileModel.find({ user: { $in: myBoards } }).populate('user');
        
        const formattedCrew = crewProfiles.map(p => {
            const name = p.user
                ? `${p.user.firstName || ''} ${p.user.lastName || ''}`.trim()
                : (p.userName || "Crew Member");
            return {
                userId: p.user?._id,
                _id: p._id,
                name: name || p.userName || "Crew Member",
                userName: p.userName,
                profilePhoto: p.profilePhoto || "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                bio: p.bio || "",
                isOfficialVerified: isUserOfficialVerified(p, p.user)
            };
        });

        return res.status(200).json({ crew: formattedCrew });
    } catch (err) {
        console.error("getBoardedCrew error:", err);
        return res.status(500).json({ message: "Failed to fetch boarded crew", error: err.message });
    }
}

export async function getCrewAndFollowing(req, res) {
    try {
        const { id } = req.params;
        const currentUserId = req.user.id;

        // Find target profile
        let targetProfile = null;
        if (id === 'me' || id === currentUserId.toString()) {
            targetProfile = await profileModel.findOne({ user: currentUserId });
        } else if (mongoose.Types.ObjectId.isValid(id)) {
            targetProfile = await profileModel.findOne({ $or: [{ _id: id }, { user: id }] });
        } else {
            targetProfile = await profileModel.findOne({ userName: id });
        }

        if (!targetProfile) {
            return res.status(404).json({ message: "Target profile not found" });
        }

        const currentUserProfile = await profileModel.findOne({ user: currentUserId });
        const myBoards = (currentUserProfile?.boards || []).map(b => b.toString());

        // 1. FOLLOWING: Users that this profile boards
        const followingProfiles = await profileModel.find({
            user: { $in: targetProfile.boards || [] }
        }).populate('user', 'firstName lastName email').lean();

        const formattedFollowing = followingProfiles.map(p => {
            const uId = p.user?._id?.toString() || p.user?.toString();
            const name = p.user && typeof p.user === 'object'
                ? `${p.user.firstName || ''} ${p.user.lastName || ''}`.trim()
                : (p.userName || "Crew Member");

            return {
                userId: uId,
                profileId: p._id,
                name: name || p.userName || "Crew Member",
                userName: p.userName,
                profilePhoto: p.profilePhoto || "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                bio: p.bio || "",
                isOfficialVerified: isUserOfficialVerified(p, p.user),
                isBoarded: myBoards.includes(uId),
                isSelf: uId === currentUserId.toString(),
                isMutual: (p.boards || []).some(b => b?.toString() === currentUserId.toString()) && myBoards.includes(uId)
            };
        });

        // 2. CREW (Followers): Profiles that have targetProfile.user in their boards
        const crewProfiles = await profileModel.find({
            boards: targetProfile.user
        }).populate('user', 'firstName lastName email').lean();

        const formattedCrew = crewProfiles.map(p => {
            const uId = p.user?._id?.toString() || p.user?.toString();
            const name = p.user && typeof p.user === 'object'
                ? `${p.user.firstName || ''} ${p.user.lastName || ''}`.trim()
                : (p.userName || "Crew Member");

            return {
                userId: uId,
                profileId: p._id,
                name: name || p.userName || "Crew Member",
                userName: p.userName,
                profilePhoto: p.profilePhoto || "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                bio: p.bio || "",
                isOfficialVerified: isUserOfficialVerified(p, p.user),
                isBoarded: myBoards.includes(uId),
                isSelf: uId === currentUserId.toString(),
                isMutual: (p.boards || []).some(b => b?.toString() === currentUserId.toString()) && myBoards.includes(uId)
            };
        });

        return res.status(200).json({
            targetUserId: targetProfile.user,
            targetUserName: targetProfile.userName,
            followingCount: formattedFollowing.length,
            crewCount: formattedCrew.length,
            following: formattedFollowing,
            crew: formattedCrew,
        });
    } catch (err) {
        console.error("getCrewAndFollowing error:", err);
        return res.status(500).json({ message: "Failed to fetch crew & following", error: err.message });
    }
}

export async function removeFollower(req, res) {
    try {
        const currentUserId = req.user.id;
        const { targetUserId } = req.params;

        const targetUserProfile = await profileModel.findOne({ user: targetUserId });
        if (!targetUserProfile) {
            return res.status(404).json({ message: "Target profile not found" });
        }

        // Pull current user from target's boards so target no longer follows current user
        targetUserProfile.boards.pull(currentUserId);
        await targetUserProfile.save();

        return res.status(200).json({ message: "Removed from your Crew successfully", status: "removed" });
    } catch (err) {
        console.error("removeFollower error:", err);
        return res.status(500).json({ message: "Failed to remove crew member", error: err.message });
    }
}

