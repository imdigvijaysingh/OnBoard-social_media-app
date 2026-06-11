import express from 'express';
import { postModel } from '../models/post.model.js';

async function getPosts(req, res) {
    const posts = await postModel.find().populate('profile').sort({ createdAt: -1 });
    
    return res.status(200).json({
        message: "Post fetched successfully!",
        posts
    })
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

export { getPosts, deletePost };