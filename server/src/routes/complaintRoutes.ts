import { Router } from 'express';
import { ComplaintController } from '../controllers/complaintController.js';
import { requireOfficerRole } from '../middlewares/auth.js';
import { complaintCreateLimiter } from '../middlewares/security.js';

const router = Router();

router.post('/', complaintCreateLimiter, ComplaintController.create);
router.get('/', ComplaintController.list);
router.get('/stats', ComplaintController.getStats);
router.get('/:id', ComplaintController.getById);
router.patch('/:id/status', requireOfficerRole, ComplaintController.updateStatus);
router.get('/:id/history', ComplaintController.getHistory);

export default router;
