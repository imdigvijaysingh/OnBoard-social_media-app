import express from 'express';
import multer from 'multer';
import { 
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
} from '../controllers/post.controller.js';
import * as authMiddleware from '../middlewares/auth.middleware.js';

const postRouter = express.Router();

const upload = multer({ 
    storage: multer.memoryStorage() 
});

postRouter.get('/', authMiddleware.authUser, getPosts);
postRouter.get('/discover', authMiddleware.optionalAuthUser, getDiscoverContent);
postRouter.get('/my-posts', authMiddleware.authUser, getMyPosts);
postRouter.get('/bookmarks', authMiddleware.authUser, getBookmarks);
postRouter.put('/interests', authMiddleware.authUser, updateUserInterests);
postRouter.post('/:id/view', authMiddleware.optionalAuthUser, recordPostView);
postRouter.delete('/:id', authMiddleware.authUser, deletePost);
postRouter.put('/:id', authMiddleware.authUser, upload.single('image'), updatePost);
postRouter.put('/:id/pin', authMiddleware.authUser, togglePinPost);
postRouter.post('/:id/like', authMiddleware.authUser, toggleLike);
postRouter.post('/:id/comment', authMiddleware.authUser, addComment);
postRouter.post('/:id/share', authMiddleware.authUser, addShare);
postRouter.post('/:id/bookmark', authMiddleware.authUser, toggleBookmark);

export default postRouter;