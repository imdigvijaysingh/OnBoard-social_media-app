import express from 'express';
import * as authController from '../controllers/auth.controller.js';

const authRouter = express.Router();

authRouter.post('/signup', authController.signup);

authRouter.post('/login', authController.login);

authRouter.post('/verify-email', authController.verifyEmail);

authRouter.post('/logout', authController.logout);

authRouter.post('/resend-otp', authController.resendOtp);

export default authRouter;