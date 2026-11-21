/**
 * aiController.ts
 * CivicResolve Phase 3 – AI REST Endpoints
 */

import { Request, Response, NextFunction } from 'express';
import path from 'path';
import { AppError } from '../middlewares/errorHandler.js';
import {
  classifyComplaint,
  detectPriority,
  analyzeImage,
  detectLanguage,
  translateComplaint,
  askAssistant,
} from '../services/geminiService.js';
import { db } from '../db/index.js';
import { DBUploadedImage } from '../types/index.js';
import { ENV } from '../config/env.js';

// ─── POST /api/ai/classify ────────────────────────────────────────────────────

export async function classifyComplaintHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { description, language } = req.body as {
      description?: string;
      language?: string;
    };

    if (!description || description.trim().length < 5) {
      throw new AppError('description is required and must be at least 5 characters.', 400);
    }

    const result = await classifyComplaint(description.trim(), language || 'en');

    res.json({
      success: true,
      data: result,
      meta: {
        model: 'gemini-1.5-flash',
        note: 'AI-generated classification — review before submitting.',
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/ai/priority ────────────────────────────────────────────────────

export async function detectPriorityHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { description, category } = req.body as {
      description?: string;
      category?: string;
    };

    if (!description || !category) {
      throw new AppError('description and category are required.', 400);
    }

    const result = await detectPriority(description.trim(), category.trim());

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/ai/analyze-image ───────────────────────────────────────────────

export async function analyzeImageHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { imageId, description } = req.body as {
      imageId?: string;
      description?: string;
    };

    if (!imageId) {
      throw new AppError('imageId is required. Upload the image first via /api/upload.', 400);
    }
    if (!description) {
      throw new AppError('description is required for consistency checking.', 400);
    }

    // Look up the uploaded image record
    const imageRecord = db
      .prepare('SELECT * FROM uploaded_images WHERE id = ?')
      .get(imageId) as DBUploadedImage | undefined;

    if (!imageRecord) {
      throw new AppError(`No uploaded image found with id "${imageId}".`, 404);
    }

    // Resolve absolute path
    const absolutePath = path.isAbsolute(imageRecord.file_path)
      ? imageRecord.file_path
      : path.resolve(imageRecord.file_path);

    const result = await analyzeImage(absolutePath, description.trim(), imageRecord.mime_type);

    res.json({
      success: true,
      data: result,
      meta: {
        imageId,
        fileName: imageRecord.original_name,
        note: 'AI image analysis — location cannot be verified from image content alone.',
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/ai/detect-language ─────────────────────────────────────────────

export async function detectLanguageHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { text } = req.body as { text?: string };

    if (!text) {
      throw new AppError('text is required.', 400);
    }

    const result = await detectLanguage(text);

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/ai/translate ───────────────────────────────────────────────────

export async function translateTextHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { text, targetLanguage } = req.body as {
      text?: string;
      targetLanguage?: string;
    };

    if (!text || !targetLanguage) {
      throw new AppError('text and targetLanguage are required.', 400);
    }

    const result = await translateComplaint(text, targetLanguage);

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// ─── POST /api/ai/assistant ───────────────────────────────────────────────────

export async function askAssistantHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { message, context, responseLanguage } = req.body as {
      message?: string;
      context?: Record<string, unknown>;
      responseLanguage?: string;
    };

    if (!message || message.trim().length < 2) {
      throw new AppError('message is required.', 400);
    }

    const result = await askAssistant(
      message.trim(),
      context || {},
      responseLanguage || 'en'
    );

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}
