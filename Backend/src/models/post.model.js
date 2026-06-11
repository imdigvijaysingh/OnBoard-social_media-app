import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
    },
    profile: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'profile',
        required: true,
    },
    image: String,
    caption: String,
}, {timestamps: true})

const postModel = mongoose.model("post", postSchema)

export { postModel };