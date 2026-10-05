import { postModel } from '../models/post.model.js';
import profileModel from '../models/profile.model.js';
import chapterModel from '../models/chapter.model.js';
import uploadFile from '../services/storage.service.js';

async function createPost(req, res) {
    try {
        const mediaType = req.body.mediaType || 'image';
        let imageUrl = '';
        let videoUrl = req.body.videoUrl || '';

        if (req.file) {
            const result = await uploadFile(req.file.buffer);
            if (mediaType === 'reel' || mediaType === 'wave' || mediaType === 'video') {
                videoUrl = result.url;
                imageUrl = req.body.thumbnailUrl || result.url;
            } else {
                imageUrl = result.url;
            }
        } else if (req.body.image) {
            imageUrl = req.body.image;
        }

        if (!imageUrl && !videoUrl) {
            return res.status(400).json({ 
                message: "Image or Video is required" 
            });
        }

        const profile = await profileModel.findOne({ user: req.user.id });
        if (!profile) {
            return res.status(404).json({ message: "Profile not found" });
        }

        let parsedTags = [];
        if (req.body.categoryTags) {
            if (Array.isArray(req.body.categoryTags)) {
                parsedTags = req.body.categoryTags.map(t => t.trim().toLowerCase());
            } else if (typeof req.body.categoryTags === 'string') {
                parsedTags = req.body.categoryTags
                    .split(',')
                    .map(t => t.replace(/#/g, '').trim().toLowerCase())
                    .filter(Boolean);
            }
        }

        const chapterId = req.body.chapterId || null;

        const post = await postModel.create({
            user: req.user.id,
            profile: profile._id,
            image: imageUrl || videoUrl,
            mediaType: mediaType,
            videoUrl: videoUrl,
            thumbnailUrl: req.body.thumbnailUrl || imageUrl,
            caption: req.body.caption || '',
            chapter: chapterId || null,
            categoryTags: parsedTags.length > 0 ? parsedTags : ['general'],
            audioTrack: req.body.audioTrack || 'Original Audio',
            viewsCount: 1,
            engagementScore: 1
        });

        if (chapterId) {
            await chapterModel.findByIdAndUpdate(chapterId, {
                $addToSet: { posts: post._id }
            });
        }

        return res.status(201).json({
            message: "Post created successfully",
            post
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to create post" });
    }
}

export { createPost };