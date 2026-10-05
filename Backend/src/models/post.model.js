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
    mediaType: {
        type: String,
        enum: ['image', 'reel', 'wave', 'video'],
        default: 'image'
    },
    videoUrl: {
        type: String,
        default: ''
    },
    thumbnailUrl: {
        type: String,
        default: ''
    },
    viewsCount: {
        type: Number,
        default: 0
    },
    categoryTags: [{
        type: String,
        trim: true,
        lowercase: true
    }],
    audioTrack: {
        type: String,
        default: 'Original Audio'
    },
    engagementScore: {
        type: Number,
        default: 0
    },
    duration: {
        type: Number,
        default: 0
    },
    caption: String,
    chapter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'chapters',
        default: null,
    },
    pinned: {
        type: Boolean,
        default: false,
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    }],
    shares: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    }],
    bookmarks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    }],
    comments: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
        profile: { type: mongoose.Schema.Types.ObjectId, ref: 'profile' },
        text: String,
        createdAt: { type: Date, default: Date.now }
    }],
}, {timestamps: true})

const postModel = mongoose.model("post", postSchema)

export { postModel };