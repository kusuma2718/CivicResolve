import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';
import { authenticateToken } from '../middlewares/auth.js';
import { apiGeneralLimiter } from '../middlewares/security.js';

const router = Router();

// Rate limit token acquisition
router.post('/officer-token', apiGeneralLimiter, AuthController.getOfficerSessionToken);
router.post('/login', apiGeneralLimiter, AuthController.login);
router.get('/verify', authenticateToken, AuthController.verifySession);

export default router;
