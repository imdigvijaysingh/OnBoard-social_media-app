import express from 'express';
import multer from 'multer';
import { createPost } from '../controllers/createPost.controller.js';

import * as authMiddleware from '../middlewares/auth.middleware.js';

const createPostRouter = express.Router();

const upload = multer({ 
    storage: multer.memoryStorage() 
})

createPostRouter.post('/', authMiddleware.authUser, upload.single('image'), createPost);

export default createPostRouter;