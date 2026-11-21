import { Router } from 'express';
import { DepartmentController } from '../controllers/departmentController.js';

const router = Router();

router.get('/', DepartmentController.list);
router.get('/:id', DepartmentController.getById);

export default router;
