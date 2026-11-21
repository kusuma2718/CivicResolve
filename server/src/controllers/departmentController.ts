import { Request, Response, NextFunction } from 'express';
import { DepartmentService } from '../services/departmentService.js';

export class DepartmentController {
  public static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const departments = DepartmentService.getAllDepartments();
      res.json({
        success: true,
        count: departments.length,
        data: departments,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const department = DepartmentService.getDepartmentById(id);
      if (!department) {
        return res.status(404).json({ success: false, error: { message: 'Department not found' } });
      }
      res.json({ success: true, data: department });
    } catch (err) {
      next(err);
    }
  }
}
