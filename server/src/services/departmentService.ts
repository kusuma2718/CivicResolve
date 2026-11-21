import { db } from '../db/index.js';
import { DBDepartment } from '../types/index.js';

export class DepartmentService {
  public static getAllDepartments(): DBDepartment[] {
    return db.prepare('SELECT * FROM departments ORDER BY name ASC').all() as DBDepartment[];
  }

  public static getDepartmentById(id: string): DBDepartment | undefined {
    return db.prepare('SELECT * FROM departments WHERE id = ?').get(id) as DBDepartment | undefined;
  }
}
