import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler.js';
import { JwtService, JwtPayload } from '../services/jwtService.js';

// Augment Express Request to strongly type authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Extract Bearer token from Authorization header
 */
function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization || (req.headers.Authorization as string);
  if (!authHeader) return null;

  const parts = authHeader.trim().split(' ');
  if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
    return parts[1].trim();
  }
  return null;
}

/**
 * Authentication Middleware
 * Enforces valid, cryptographically signed JWT. Rejects missing, expired, or tampered tokens.
 * Completely ignores client-controlled 'x-user-role' headers for security.
 */
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      throw new AppError('Authentication required. Missing Bearer token in Authorization header.', 401);
    }

    const payload = JwtService.verify(token);
    req.user = payload;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Role-Based Access Control: Municipal Officer or Administrator
 * Requires verified token with 'officer' or 'admin' role. Rejects 'citizen' role and invalid tokens.
 */
export function requireOfficerRole(req: Request, res: Response, next: NextFunction) {
  try {
    // If not already authenticated by prior middleware, authenticate now
    if (!req.user) {
      const token = extractBearerToken(req);
      if (!token) {
        throw new AppError(
          'Authentication required: Operational municipal action requires a valid officer Bearer token.',
          401
        );
      }
      req.user = JwtService.verify(token);
    }

    if (req.user.role !== 'officer' && req.user.role !== 'admin') {
      throw new AppError(
        'Forbidden: Operational municipal action requires officer or admin credentials.',
        403
      );
    }

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Role-Based Access Control: System Administrator Only
 */
export function requireAdminRole(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      const token = extractBearerToken(req);
      if (!token) {
        throw new AppError('Authentication required: Administrator credentials required.', 401);
      }
      req.user = JwtService.verify(token);
    }

    if (req.user.role !== 'admin') {
      throw new AppError('Forbidden: Administrator credentials required.', 403);
    }

    next();
  } catch (err) {
    next(err);
  }
}
