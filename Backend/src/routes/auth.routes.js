import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import * as authMiddleware from '../middlewares/auth.middleware.js';
import { loginIpLimiter } from '../middlewares/rateLimiter.middleware.js';

const authRouter = express.Router();

authRouter.post('/signup', authController.signup);
authRouter.post('/login', loginIpLimiter, authController.login);
authRouter.post('/google', authController.googleAuth);
authRouter.get('/cloud-backup', authMiddleware.authUser, authController.toggleCloudBackup);
authRouter.put('/cloud-backup', authMiddleware.authUser, authController.toggleCloudBackup);
authRouter.post('/verify-email', authController.verifyEmail);
authRouter.post('/logout', authController.logout);
authRouter.post('/resend-otp', authController.resendOtp);

export default authRouter;