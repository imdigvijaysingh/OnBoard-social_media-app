import express from 'express';
import * as safetyController from '../controllers/safety.controller.js';
import * as authMiddleware from '../middlewares/auth.middleware.js';

const safetyRouter = express.Router();

safetyRouter.get('/status', authMiddleware.authUser, safetyController.getSafetyStatus);
safetyRouter.post('/report', authMiddleware.authUser, safetyController.submitReport);
safetyRouter.get('/blocked', authMiddleware.authUser, safetyController.getBlockedUsers);
safetyRouter.post('/block/:id', authMiddleware.authUser, safetyController.blockUser);
safetyRouter.post('/unblock/:id', authMiddleware.authUser, safetyController.unblockUser);

export default safetyRouter;
