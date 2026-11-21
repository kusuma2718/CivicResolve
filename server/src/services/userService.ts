import { db } from '../db/index.js';
import { v4 as uuidv4 } from 'uuid';
import { DBUser } from '../types/index.js';

export class UserService {
  public static getOrCreateUser(email: string, name: string, preferredLanguage: string = 'en'): DBUser {
    let user = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email) as DBUser | undefined;
    if (!user) {
      const now = new Date().toISOString();
      const id = `usr-${uuidv4()}`;
      db.prepare(`
        INSERT INTO users (id, name, email, phone, role, preferred_language, department_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, name, email.toLowerCase(), null, 'citizen', preferredLanguage, null, now);

      user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as DBUser;
    }
    return user;
  }

  public static updateLanguagePreference(emailOrId: string, language: string) {
    db.prepare(`
      UPDATE users SET preferred_language = ? WHERE id = ? OR LOWER(email) = LOWER(?)
    `).run(language, emailOrId, emailOrId);

    return db.prepare('SELECT * FROM users WHERE id = ? OR LOWER(email) = LOWER(?)').get(emailOrId, emailOrId) as DBUser | undefined;
  }

  public static getUserPreference(emailOrId: string) {
    return db.prepare('SELECT id, name, email, preferred_language, role FROM users WHERE id = ? OR LOWER(email) = LOWER(?)').get(emailOrId, emailOrId);
  }
}
