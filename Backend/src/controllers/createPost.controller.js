import { postModel } from '../models/post.model.js';
import profileModel from '../models/profile.model.js';
import uploadFile from '../services/storage.service.js';

async function createPost(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                message: "Image is required" 
            });
        }

        const result = await uploadFile(req.file.buffer);

        const profile = await profileModel.findOne({ user: req.user.id });
        if (!profile) {
            return res.status(404).json({ message: "Profile not found" });
        }

        const post = await postModel.create({
            user: req.user.id,
            profile: profile._id,
            image: result.url,
            caption: req.body.caption
        });

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