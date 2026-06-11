import express from 'express';
import { getPosts, deletePost } from '../controllers/post.controller.js';
import * as authMiddleware from '../middlewares/auth.middleware.js';

const postRouter = express.Router();

postRouter.get('/', getPosts);
postRouter.delete('/:id', authMiddleware.authUser, deletePost);

export default postRouter;