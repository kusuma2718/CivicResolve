import { Router } from 'express';
import { uploadMiddleware } from '../middlewares/upload.js';
import { UploadController } from '../controllers/uploadController.js';
import { uploadLimiter } from '../middlewares/security.js';

const router = Router();

router.post('/', uploadLimiter, uploadMiddleware.single('image'), UploadController.uploadImage);

export default router;
