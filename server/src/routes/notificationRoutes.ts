import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController.js';

const router = Router();

router.get('/', NotificationController.list);
router.patch('/:id/read', NotificationController.markRead);

export default router;
