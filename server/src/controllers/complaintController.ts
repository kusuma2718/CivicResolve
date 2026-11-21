import { Request, Response, NextFunction } from 'express';
import { ComplaintService } from '../services/complaintService.js';
import { AppError } from '../middlewares/errorHandler.js';

export class ComplaintController {
  public static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { title, description, category, location, city, state, citizenName, email } = req.body;

      if (!title || !description || !category || !location || !city || !state || !citizenName || !email) {
        throw new AppError('Missing required fields: title, description, category, location, city, state, citizenName, email.', 400);
      }

      const validCategories = [
        'Roads and Potholes',
        'Garbage and Sanitation',
        'Streetlights and Electricity',
        'Water Supply and Leakage',
        'Drainage and Sewage',
        'Public Infrastructure',
        'Traffic and Transportation',
        'Other',
      ];
      if (!validCategories.includes(category)) {
        throw new AppError(`Invalid category. Must be one of: ${validCategories.join(', ')}`, 400);
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(String(email).trim())) {
        throw new AppError('Invalid email address format.', 400);
      }

      if (String(title).trim().length > 200) {
        throw new AppError('Title exceeds maximum allowed length of 200 characters.', 400);
      }

      if (String(description).trim().length < 10) {
        throw new AppError('Description must be at least 10 characters in length.', 400);
      }

      if (String(description).trim().length > 5000) {
        throw new AppError('Description exceeds maximum allowed length of 5000 characters.', 400);
      }

      const complaint = ComplaintService.createComplaint(req.body);

      res.status(201).json({
        success: true,
        data: complaint,
        message: 'Civic complaint registered successfully.',
      });
    } catch (err) {
      next(err);
    }
  }

  public static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const complaints = ComplaintService.listComplaints(req.query as any);
      res.json({
        success: true,
        count: complaints.length,
        data: complaints,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const complaint = ComplaintService.getComplaintById(id);
      res.json({
        success: true,
        data: complaint,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status, actorName, actorRole, notes } = req.body;

      if (!status) {
        throw new AppError('Field "status" is required.', 400);
      }

      const validStatuses = ['Reported', 'Under Review', 'In Progress', 'Resolved', 'Rejected'];
      if (!validStatuses.includes(status)) {
        throw new AppError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
      }

      const updated = ComplaintService.updateStatus(id, { status, actorName, actorRole, notes });
      res.json({
        success: true,
        data: updated,
        message: `Complaint ${id} status updated to ${status}.`,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const complaint = ComplaintService.getComplaintById(id);
      res.json({
        success: true,
        complaintId: id,
        data: complaint.timeline,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = ComplaintService.getStats();
      res.json({
        success: true,
        data: stats,
      });
    } catch (err) {
      next(err);
    }
  }
}
