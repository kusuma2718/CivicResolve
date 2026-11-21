import { db } from '../db/index.js';
import { DBNotification } from '../types/index.js';

export class NotificationService {
  public static getNotifications(userId?: string): DBNotification[] {
    if (userId) {
      return db.prepare('SELECT * FROM notifications WHERE user_id = ? OR user_id IS NULL ORDER BY created_at DESC LIMIT 50').all(userId) as DBNotification[];
    }
    return db.prepare('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50').all() as DBNotification[];
  }

  public static markAsRead(id: string) {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(id);
    return { success: true, id };
  }
}
