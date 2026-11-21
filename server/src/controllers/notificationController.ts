import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notificationService.js';

export class NotificationController {
  public static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.query;
      const notifications = NotificationService.getNotifications(userId as string);
      res.json({
        success: true,
        count: notifications.length,
        data: notifications,
      });
    } catch (err) {
      next(err);
    }
  }

  public static async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = NotificationService.markAsRead(id);
      res.json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}
