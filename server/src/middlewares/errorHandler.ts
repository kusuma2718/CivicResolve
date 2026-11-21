import { Request, Response, NextFunction } from 'express';
import { ENV } from '../config/env.js';

export class AppError extends Error {
  statusCode: number;
  details?: any;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 400, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);

  // In production, sanitize unexpected 500 internal errors to avoid leaking database paths or stack traces
  const isProduction = ENV.NODE_ENV === 'production';
  const isOperational = Boolean(err.isOperational);
  const safeMessage =
    isProduction && statusCode >= 500 && !isOperational
      ? 'An internal municipal server error occurred. Please try again later.'
      : err.message || 'An internal server error occurred.';

  console.error(`[Error] ${req.method} ${req.url} -> ${statusCode}:`, err);

  res.status(statusCode).json({
    success: false,
    error: {
      message: safeMessage,
      statusCode,
      details: isProduction && statusCode >= 500 ? null : (err.details || null),
      timestamp: new Date().toISOString(),
    },
  });
}
