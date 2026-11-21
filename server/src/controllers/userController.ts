import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/userService.js';
import { AppError } from '../middlewares/errorHandler.js';

export class UserController {
  public static async updatePreference(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, language, name } = req.body;
      if (!email || !language) {
        throw new AppError('Email and language are required.', 400);
      }

      UserService.getOrCreateUser(email, name || 'Citizen', language);
      const user = UserService.updateLanguagePreference(email, language);

      res.json({
        success: true,
        data: user,
        message: 'Language preference saved.',
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getPreference(req: Request, res: Response, next: NextFunction) {
    try {
      const { identifier } = req.params;
      const user = UserService.getUserPreference(identifier);
      if (!user) {
        return res.status(404).json({ success: false, error: { message: 'User preference not found' } });
      }
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  }
}
