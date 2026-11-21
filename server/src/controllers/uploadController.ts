import { Request, Response, NextFunction } from 'express';
import { db } from '../db/index.js';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../middlewares/errorHandler.js';

export class UploadController {
  public static async uploadImage(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new AppError('No image file provided.', 400);
      }

      const file = req.file;
      const imageId = `img-${uuidv4()}`;
      const now = new Date().toISOString();
      const relativeUrl = `/uploads/${file.filename}`;

      db.prepare(`
        INSERT INTO uploaded_images (id, complaint_id, file_name, original_name, file_path, mime_type, file_size, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        imageId,
        req.body.complaintId || null,
        file.filename,
        file.originalname,
        file.path,
        file.mimetype,
        file.size,
        now
      );

      res.status(201).json({
        success: true,
        data: {
          imageId,
          fileName: file.filename,
          originalName: file.originalname,
          url: relativeUrl,
          mimeType: file.mimetype,
          size: file.size,
        },
        message: 'Image uploaded and registered successfully.',
      });
    } catch (err) {
      next(err);
    }
  }
}
