import express from 'express';
import multer from 'multer';
import * as profileController from '../controllers/profile.controller.js';
import * as authMiddleware from '../middlewares/auth.middleware.js';

const profileRouter = express.Router();

const upload = multer({
    storage: multer.memoryStorage()
})

profileRouter.post('/create', authMiddleware.authUser, upload.single('profilePhoto'), profileController.createProfile);
profileRouter.get('/get-me', authMiddleware.authUser, profileController.getMe);
profileRouter.get('/me', authMiddleware.authUser, profileController.getMe);
profileRouter.get('/crew', authMiddleware.authUser, profileController.getBoardedCrew);
profileRouter.get('/boarded-crew', authMiddleware.authUser, profileController.getBoardedCrew);
profileRouter.get('/suggestions', authMiddleware.authUser, profileController.getSuggestions);
profileRouter.get('/search', authMiddleware.authUser, profileController.searchUsers);
profileRouter.get('/user/:id', authMiddleware.authUser, profileController.getUserProfile);
profileRouter.put('/privacy', authMiddleware.authUser, profileController.togglePrivacy);
profileRouter.post('/:id/board', authMiddleware.authUser, profileController.toggleBoard);
profileRouter.put('/update', authMiddleware.authUser, upload.single('profilePhoto'), profileController.updateProfile);
profileRouter.get('/check-username/:username', authMiddleware.authUser, profileController.checkUsernameAvailability);
profileRouter.post('/birthday-alerts', authMiddleware.authUser, profileController.triggerBirthdayAlerts);
profileRouter.put('/bio', authMiddleware.authUser, profileController.updateBio);
profileRouter.put('/membership', authMiddleware.authUser, profileController.updateMembership);
profileRouter.get('/notifications', authMiddleware.authUser, profileController.getNotifications);
profileRouter.post('/subscribe-tick', authMiddleware.authUser, profileController.subscribeTick);
profileRouter.post('/:id/accept-board', authMiddleware.authUser, profileController.acceptRequest);
profileRouter.post('/:id/reject-board', authMiddleware.authUser, profileController.rejectRequest);
profileRouter.get('/:id/crew-members', authMiddleware.authUser, profileController.getCrewAndFollowing);
profileRouter.post('/remove-follower/:targetUserId', authMiddleware.authUser, profileController.removeFollower);

export default profileRouter;