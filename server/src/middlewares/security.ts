import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler.js';

/**
 * Standard HTTP Security Headers Middleware
 * Protects against MIME sniffing, clickjacking, framing, and legacy XSS vectors.
 */
export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction) {
  // Prevent MIME-sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Prevent framing / clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // XSS filter for older user agents
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Restrict referrer data
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // HSTS (HTTP Strict Transport Security) - enforced in HTTPS environments
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  // Clean CSP header allowing local assets & API endpoints
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' data: blob: http: https:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' http: https:;"
  );

  next();
}

/**
 * In-Memory Sliding Window Rate Limiter
 * Provides IP-based rate limiting with zero external dependencies.
 *
 * Operational Characteristics & Deployment Notes:
 * 1. Single-Instance Deployment (Production Target):
 *    - In-memory storage runs directly in Node.js process with zero network hop latency.
 *    - Fully suitable for standard single-instance municipal deployments (e.g. systemd/single-PM2 instance).
 * 2. Restart Behavior:
 *    - State is held in-memory; counters reset to 0 upon server restart.
 *    - Prevents stale IP lockouts after server maintenance or deployment restarts.
 * 3. Multi-Instance Scaling Limitation:
 *    - In a horizontally scaled cluster (multiple Node.js worker processes or multi-server load balancer),
 *      each instance maintains its own isolated in-memory window. An attacker could distribute requests
 *      across N replicas. For multi-instance scaling, integrate a shared distributed store (such as Redis)
 *      or enforce sticky session routing at the load balancer.
 */
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

export function createRateLimiter(options: {
  windowMs: number;
  maxRequests: number;
  message?: string;
}) {
  const store = new Map<string, RateLimitRecord>();
  const { windowMs, maxRequests, message = 'Too many requests. Please slow down and try again later.' } = options;

  // Periodic cleanup of stale client IPs every 5 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of store.entries()) {
      if (now > record.resetTime) {
        store.delete(ip);
      }
    }
  }, 5 * 60 * 1000).unref();

  return (req: Request, res: Response, next: NextFunction) => {
    // Rely on Express-calculated req.ip, which respects trusted proxy configuration and rejects spoofed headers
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    const record = store.get(clientIp);

    if (!record || now > record.resetTime) {
      store.set(clientIp, {
        count: 1,
        resetTime: now + windowMs,
      });
      return next();
    }

    if (record.count >= maxRequests) {
      const retryAfterSec = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSec);
      return next(new AppError(message, 429));
    }

    record.count++;
    next();
  };
}

// Preset rate limiters
export const apiGeneralLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 180,    // 180 requests per minute
});

export const complaintCreateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30,     // 30 complaints per minute per IP
  message: 'Complaint submission limit exceeded. Please wait before submitting another report.',
});

export const uploadLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 20,     // 20 file uploads per minute per IP
  message: 'Upload frequency limit exceeded. Please wait a moment.',
});

export const aiAssistantLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 30,     // 30 AI prompts per minute per IP
  message: 'AI assistant prompt quota exceeded for this minute. Please wait a moment.',
});
