import { Router } from 'express';
import { UserController } from '../controllers/userController.js';

const router = Router();

router.post('/preference', UserController.updatePreference);
router.get('/:identifier/preference', UserController.getPreference);

export default router;
