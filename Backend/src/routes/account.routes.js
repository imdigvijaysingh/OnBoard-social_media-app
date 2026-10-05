import express from 'express';
import * as accountController from '../controllers/account.controller.js';
import * as authMiddleware from '../middlewares/auth.middleware.js';

const accountRouter = express.Router();

accountRouter.put('/email', authMiddleware.authUser, accountController.updateEmail);
accountRouter.put('/password', authMiddleware.authUser, accountController.changePassword);
accountRouter.delete('/delete', authMiddleware.authUser, accountController.deleteAccount);

export default accountRouter;
