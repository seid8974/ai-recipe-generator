import express from 'express';
import * as authController from '../controllers/authController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

router.post('/signup', authController.register);
router.post('/login', authController.login);
router.get('/me', authMiddleware, authController.getCurrentUser);

// Password reset flow
router.post('/reset-password', authController.requestPasswordReset);
router.get('/reset-password/:token', authController.validateResetToken);
router.post('/reset-password/confirm', authController.resetPassword);

export default router;
