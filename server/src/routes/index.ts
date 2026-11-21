import { Router } from 'express';
import complaintRoutes from './complaintRoutes.js';
import departmentRoutes from './departmentRoutes.js';
import userRoutes from './userRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import uploadRoutes from './uploadRoutes.js';
import aiRoutes from './aiRoutes.js';
import intelligenceRoutes from './intelligenceRoutes.js';
import authRoutes from './authRoutes.js';
import { ENV } from '../config/env.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/complaints', complaintRoutes);
router.use('/departments', departmentRoutes);
router.use('/users', userRoutes);
router.use('/notifications', notificationRoutes);
router.use('/upload', uploadRoutes);
router.use('/ai', aiRoutes);
router.use('/intelligence', intelligenceRoutes);

router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    platform: 'CIVICRESOLVE API',
    version: '6.0.0-phase6-security',
    environment: ENV.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

export default router;
