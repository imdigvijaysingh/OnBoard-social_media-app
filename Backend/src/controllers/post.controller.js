import express from 'express';
import { postModel } from '../models/post.model.js';
import uploadFile from '../services/storage.service.js';

import profileModel from '../models/profile.model.js';
import { ensureUserProfile } from './profile.controller.js';
import { createNotification, createGroupedNotification } from '../services/notification.service.js';

async function getPosts(req, res) {
    try {
        const currentUserId = req.user.id;
        
        // Find current user's profile to get who they have boarded
        const currentUserProfile = await profileModel.findOne({ user: currentUserId });
        const myBoards = currentUserProfile?.boards || [];
        
        // Find users from myBoards who also have currentUserId in their boards
        const mutualFriendsProfiles = await profileModel.find({
            user: { $in: myBoards },
            boards: currentUserId
        });
        
        // Extract the user IDs of mutual friends
        const mutualFriendsIds = mutualFriendsProfiles.map(p => p.user);
        
        // Allowed authors: current user + mutual friends
        const allowedAuthors = [currentUserId, ...mutualFriendsIds];
        
        const posts = await postModel.find({ user: { $in: allowedAuthors } })
            .populate('profile')
            .sort({ createdAt: -1 });
        
        return res.status(200).json({
            message: "Post fetched successfully!",
            posts
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to fetch posts" });
    }
}

async function deletePost(req, res) {
    try {
        const post = await postModel.findById(req.params.id);
        
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }
        
        if (post.user.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not authorized to delete this post" });
        }
        
        await postModel.findByIdAndDelete(req.params.id);
        
        return res.status(200).json({ message: "Post deleted successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to delete post" });
    }
}

async function getMyPosts(req, res) {
    try {
        const posts = await postModel.find({ user: req.user.id })
            .populate('profile')
            .sort({ pinned: -1, createdAt: -1 });

        return res.status(200).json({
            message: "User's posts fetched successfully!",
            posts
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to fetch user's posts" });
    }
}

async function updatePost(req, res) {
    try {
        const post = await postModel.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        if (post.user.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not authorized to update this post" });
        }

        if (req.body.caption !== undefined) {
            post.caption = req.body.caption;
        }

        if (req.file) {
            const result = await uploadFile(req.file.buffer);
            post.image = result.url;
        }

        await post.save();

        const populatedPost = await postModel.findById(post._id).populate('profile');

        return res.status(200).json({
            message: "Post updated successfully",
            post: populatedPost
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to update post" });
    }
}

async function togglePinPost(req, res) {
    try {
        const post = await postModel.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        if (post.user.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not authorized to pin/unpin this post" });
        }

        const targetPinnedState = !post.pinned;

        if (targetPinnedState) {
            const pinnedCount = await postModel.countDocuments({ user: req.user.id, pinned: true });
            if (pinnedCount >= 3) {
                return res.status(400).json({
                    message: "You can only pin up to 3 posts."
                });
            }
        }

        post.pinned = targetPinnedState;
        await post.save();

        const populatedPost = await postModel.findById(post._id).populate('profile');

        return res.status(200).json({
            message: `Post ${post.pinned ? 'pinned' : 'unpinned'} successfully`,
            post: populatedPost
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to pin/unpin post" });
    }
}

async function toggleLike(req, res) {
    try {
        const post = await postModel.findById(req.params.id);
        if (!post) return res.status(404).json({ message: "Post not found" });

        const userId = req.user.id;
        const index = post.likes.indexOf(userId);

        if (index === -1) {
            post.likes.push(userId);
            // Trigger grouped like notification (self-action protected)
            createGroupedNotification({
                recipient: post.user,
                actor: userId,
                type: "LIKE",
                category: "social",
                priority: "low",
                groupKey: `like_post_${post._id}`,
                entityType: "post",
                entityId: post._id,
                deepLink: `/feed`,
                targetTitle: "post",
            }).catch(e => console.error("Like notif error:", e));
        } else {
            post.likes.splice(index, 1);
        }

        await post.save();
        const populatedPost = await postModel.findById(post._id).populate('profile').populate('comments.profile');
        
        return res.status(200).json({ post: populatedPost });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to toggle like" });
    }
}

async function addComment(req, res) {
    try {
        const post = await postModel.findById(req.params.id);
        if (!post) return res.status(404).json({ message: "Post not found" });

        const userId = req.user.id;
        const userProfile = await profileModel.findOne({ user: userId });
        
        if (!userProfile) return res.status(404).json({ message: "Profile not found" });

        post.comments.push({
            user: userId,
            profile: userProfile._id,
            text: req.body.text
        });

        await post.save();

        // Trigger comment notification (self-action protected)
        createNotification({
            recipient: post.user,
            actor: userId,
            type: "COMMENT",
            category: "social",
            priority: "normal",
            title: "New Comment",
            body: `commented: "${req.body.text ? req.body.text.slice(0, 60) : 'comment'}"`,
            entityType: "post",
            entityId: post._id,
            deepLink: `/feed`,
            metadata: { commentSnippet: req.body.text?.slice(0, 100) },
            sourceEventId: `comment:${post._id}:${Date.now()}`,
        }).catch(e => console.error("Comment notif error:", e));

        const populatedPost = await postModel.findById(post._id).populate('profile').populate('comments.profile');
        
        return res.status(200).json({ post: populatedPost });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to add comment" });
    }
}

async function addShare(req, res) {
    try {
        const post = await postModel.findById(req.params.id);
        if (!post) return res.status(404).json({ message: "Post not found" });

        const userId = req.user.id;
        if (!post.shares.includes(userId)) {
            post.shares.push(userId);
            await post.save();
        }

        const populatedPost = await postModel.findById(post._id).populate('profile').populate('comments.profile');
        
        return res.status(200).json({ post: populatedPost });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to share post" });
    }
}

async function toggleBookmark(req, res) {
    try {
        const postId = req.params.id;
        const userId = req.user.id;

        const post = await postModel.findById(postId);
        if (!post) return res.status(404).json({ message: "Post not found" });

        const userProfile = await profileModel.findOne({ user: userId });
        if (!userProfile) return res.status(404).json({ message: "Profile not found" });

        if (!userProfile.savedPosts) {
            userProfile.savedPosts = [];
        }
        if (!post.bookmarks) {
            post.bookmarks = [];
        }

        const isSaved = userProfile.savedPosts.some(
            (id) => id && id.toString() === postId.toString()
        );

        if (isSaved) {
            // Unsave / remove bookmark
            userProfile.savedPosts = userProfile.savedPosts.filter(
                (id) => id && id.toString() !== postId.toString()
            );
            post.bookmarks = post.bookmarks.filter(
                (id) => id && id.toString() !== userId.toString()
            );
        } else {
            // Save / add bookmark
            userProfile.savedPosts.push(postId);
            if (!post.bookmarks.includes(userId)) {
                post.bookmarks.push(userId);
            }
        }

        await userProfile.save();
        await post.save();

        return res.status(200).json({
            message: !isSaved ? "Post saved to your bookmarks ✨" : "Post removed from your bookmarks",
            isSaved: !isSaved,
            bookmarkCount: post.bookmarks.length,
        });
    } catch (err) {
        console.error("Failed to toggle bookmark", err);
        return res.status(500).json({ message: "Failed to toggle bookmark" });
    }
}

async function getBookmarks(req, res) {
    try {
        const userId = req.user.id;
        let userProfile = await profileModel.findOne({ user: userId });
        if (!userProfile) {
            userProfile = await ensureUserProfile(userId);
        }
        if (!userProfile) {
            return res.status(200).json({
                message: "Bookmarks fetched successfully!",
                posts: []
            });
        }

        const savedPostIds = userProfile.savedPosts || [];
        const posts = await postModel.find({ _id: { $in: savedPostIds } })
            .populate('profile')
            .populate('user', 'firstName lastName')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: "Bookmarks fetched successfully!",
            posts
        });
    } catch (err) {
        console.error("Failed to fetch bookmarks", err);
        return res.status(500).json({ message: "Failed to fetch bookmarks" });
    }
}

// Mathematical rank score calculation helper for Discover algorithm
function calculateRankScore(post, userInterests = []) {
    const views = post.viewsCount || 0;
    const likes = post.likes ? post.likes.length : 0;
    const comments = post.comments ? post.comments.length : 0;
    const shares = post.shares ? post.shares.length : 0;
    const bookmarks = post.bookmarks ? post.bookmarks.length : 0;

    const baseScore = (views * 0.4) + (likes * 2.5) + (comments * 4) + (shares * 5) + (bookmarks * 3.5);

    // Dynamic taste profile vector affinity boost
    let interestBonus = 0;
    if (userInterests.length > 0 && Array.isArray(post.categoryTags)) {
        const matches = post.categoryTags.filter(t => 
            userInterests.some(ui => ui.toLowerCase() === t.toLowerCase())
        ).length;
        interestBonus = matches * 15;
    }

    // Time decay factor: (hours + 2)^1.2
    const hoursOld = Math.max(0, (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60));
    const decay = Math.pow(hoursOld + 2, 1.2);

    return (baseScore + interestBonus) / (decay * 0.1 || 1);
}

async function getDiscoverContent(req, res) {
    try {
        const currentUserId = req.user?.id;
        let currentUserProfile = null;
        if (currentUserId) {
            currentUserProfile = await profileModel.findOne({ user: currentUserId });
        }

        const userInterests = currentUserProfile?.interests?.length 
            ? currentUserProfile.interests 
            : ['tech', 'travel', 'comedy', 'music', 'fitness', 'art', 'food', 'gaming'];
        
        const { category, type, sort = 'trending', q } = req.query;

        // Build search & filter conditions
        let queryFilter = {};

        // Category filter
        if (category && category !== 'all' && category !== 'trending') {
            queryFilter.categoryTags = { $in: [new RegExp(category, 'i')] };
        }

        // Type filter (waves / reels or posts)
        if (type === 'reels' || type === 'waves') {
            queryFilter.$or = [
                { mediaType: { $in: ['reel', 'wave', 'video'] } },
                { videoUrl: { $exists: true, $ne: '' } }
            ];
        } else if (type === 'posts') {
            queryFilter.mediaType = 'image';
        }

        // Keyword query search across caption, categoryTags, audioTrack
        if (q && q.trim()) {
            const regex = new RegExp(q.trim(), 'i');
            queryFilter.$or = [
                { caption: regex },
                { categoryTags: regex },
                { audioTrack: regex }
            ];
        }

        // Fetch matching posts
        let posts = await postModel.find(queryFilter)
            .populate('profile')
            .populate('user', 'firstName lastName')
            .lean();

        // Calculate dynamic rank score for each post
        posts = posts.map(p => {
            const isWave = p.mediaType === 'reel' || p.mediaType === 'wave' || p.mediaType === 'video' || (p.videoUrl && p.videoUrl.length > 0);
            return {
                ...p,
                dynamicRank: calculateRankScore(p, userInterests),
                isLiked: currentUserId && p.likes ? p.likes.some(id => id.toString() === currentUserId.toString()) : false,
                isSaved: currentUserProfile?.savedPosts ? currentUserProfile.savedPosts.some(id => id.toString() === p._id.toString()) : false,
                likeCount: p.likes ? p.likes.length : 0,
                commentCount: p.comments ? p.comments.length : 0,
                viewsCount: p.viewsCount || 0,
                isReel: isWave,
                isWave: isWave,
            };
        });

        // Sort posts according to user choice
        if (sort === 'top-views') {
            posts.sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0));
        } else if (sort === 'recent') {
            posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else {
            // 'trending' or 'for-you' (smart algorithmic blend)
            posts.sort((a, b) => b.dynamicRank - a.dynamicRank);
        }

        // Fetch top waves specifically for the Spotlight Shelf (always top viewed waves across the platform)
        let topReels = await postModel.find({
            $or: [
                { mediaType: { $in: ['reel', 'wave', 'video'] } },
                { videoUrl: { $exists: true, $ne: '' } }
            ]
        })
            .populate('profile')
            .populate('user', 'firstName lastName')
            .sort({ viewsCount: -1, createdAt: -1 })
            .limit(10)
            .lean();

        topReels = topReels.map((r, idx) => ({
            ...r,
            rankPosition: idx + 1,
            isLiked: currentUserId && r.likes ? r.likes.some(id => id.toString() === currentUserId.toString()) : false,
            isSaved: currentUserProfile?.savedPosts ? currentUserProfile.savedPosts.some(id => id.toString() === r._id.toString()) : false,
            likeCount: r.likes ? r.likes.length : 0,
            commentCount: r.comments ? r.comments.length : 0,
            viewsCount: r.viewsCount || 0,
            isReel: true,
            isWave: true,
        }));

        // Similar interests content: posts specifically matching user's top interests
        let similarInterestsPosts = [];
        if (userInterests.length > 0) {
            similarInterestsPosts = await postModel.find({
                categoryTags: { $in: userInterests.map(t => new RegExp(t, 'i')) }
            })
            .populate('profile')
            .populate('user', 'firstName lastName')
            .sort({ viewsCount: -1, createdAt: -1 })
            .limit(12)
            .lean();

            similarInterestsPosts = similarInterestsPosts.map(p => {
                const isWave = p.mediaType === 'reel' || p.mediaType === 'wave' || p.mediaType === 'video' || (p.videoUrl && p.videoUrl.length > 0);
                return {
                    ...p,
                    isLiked: currentUserId && p.likes ? p.likes.some(id => id.toString() === currentUserId.toString()) : false,
                    isSaved: currentUserProfile?.savedPosts ? currentUserProfile.savedPosts.some(id => id.toString() === p._id.toString()) : false,
                    likeCount: p.likes ? p.likes.length : 0,
                    commentCount: p.comments ? p.comments.length : 0,
                    viewsCount: p.viewsCount || 0,
                    isReel: isWave,
                    isWave: isWave,
                };
            });
        }

        // All category tags available across the platform with item count
        const allPostsForTags = await postModel.find({}, 'categoryTags').lean();
        const tagMap = {};
        allPostsForTags.forEach(p => {
            if (Array.isArray(p.categoryTags)) {
                p.categoryTags.forEach(tag => {
                    const clean = tag.toLowerCase().trim();
                    if (clean) tagMap[clean] = (tagMap[clean] || 0) + 1;
                });
            }
        });

        const trendingTags = Object.keys(tagMap)
            .map(tag => ({ tag, count: tagMap[tag] }))
            .sort((a, b) => b.count - a.count);

        return res.status(200).json({
            message: "Discover content fetched successfully",
            topReels,
            topWaves: topReels,
            similarInterestsPosts,
            exploreGrid: posts,
            userInterests,
            trendingTags,
            currentUserProfile: currentUserProfile ? {
                userName: currentUserProfile.userName,
                profilePhoto: currentUserProfile.profilePhoto,
                interests: currentUserProfile.interests || []
            } : null
        });
    } catch (err) {
        console.error("Failed to fetch discover content", err);
        return res.status(500).json({ message: "Failed to fetch discover content" });
    }
}

async function recordPostView(req, res) {
    try {
        const postId = req.params.id;
        const currentUserId = req.user?.id;

        const post = await postModel.findById(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        post.viewsCount = (post.viewsCount || 0) + 1;
        post.engagementScore = (post.viewsCount * 0.4) + 
            ((post.likes?.length || 0) * 2.5) + 
            ((post.comments?.length || 0) * 4) + 
            ((post.shares?.length || 0) * 5) + 
            ((post.bookmarks?.length || 0) * 3.5);
            
        await post.save();

        // Increment user affinity if logged in
        if (currentUserId && Array.isArray(post.categoryTags)) {
            const userProfile = await profileModel.findOne({ user: currentUserId });
            if (userProfile) {
                if (!userProfile.interestScores) userProfile.interestScores = new Map();
                post.categoryTags.forEach(tag => {
                    const clean = tag.toLowerCase().trim();
                    const prev = userProfile.interestScores.get(clean) || 0;
                    userProfile.interestScores.set(clean, prev + 1);
                });
                await userProfile.save();
            }
        }

        return res.status(200).json({
            message: "View recorded successfully",
            viewsCount: post.viewsCount,
            engagementScore: post.engagementScore
        });
    } catch (err) {
        console.error("Failed to record view", err);
        return res.status(500).json({ message: "Failed to record view" });
    }
}

async function updateUserInterests(req, res) {
    try {
        const currentUserId = req.user?.id;
        if (!currentUserId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const { interests } = req.body;
        if (!Array.isArray(interests)) {
            return res.status(400).json({ message: "Interests must be an array of strings" });
        }

        const cleanedInterests = interests.map(i => i.toLowerCase().trim()).filter(Boolean);

        const profile = await profileModel.findOneAndUpdate(
            { user: currentUserId },
            { $set: { interests: cleanedInterests } },
            { new: true }
        );

        return res.status(200).json({
            message: "Interests updated successfully",
            interests: profile?.interests || []
        });
    } catch (err) {
        console.error("Failed to update interests", err);
        return res.status(500).json({ message: "Failed to update interests" });
    }
}

export { 
    getPosts, 
    deletePost, 
    getMyPosts, 
    updatePost, 
    togglePinPost, 
    toggleLike, 
    addComment, 
    addShare, 
    toggleBookmark, 
    getBookmarks,
    getDiscoverContent,
    recordPostView,
    updateUserInterests
};