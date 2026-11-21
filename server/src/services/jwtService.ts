import crypto from 'node:crypto';
import { ENV } from '../config/env.js';
import { AppError } from '../middlewares/errorHandler.js';

export type UserRole = 'citizen' | 'officer' | 'admin';

export interface JwtPayload {
  sub: string;
  role: UserRole;
  email?: string;
  name?: string;
  departmentId?: string | null;
  iat: number;
  exp: number;
}

export interface SignTokenOptions {
  sub: string;
  role: UserRole;
  email?: string;
  name?: string;
  departmentId?: string | null;
  expiresInSeconds?: number;
}

/**
 * Base64URL encode a buffer or UTF-8 string
 */
function base64UrlEncode(input: Buffer | string): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
  return buf.toString('base64url');
}

/**
 * Base64URL decode to a Buffer
 */
function base64UrlDecode(str: string): Buffer {
  return Buffer.from(str, 'base64url');
}

export class JwtService {
  private static readonly HEADER = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  private static readonly DEFAULT_EXPIRY_SECONDS = 8 * 60 * 60; // 8 hours

  /**
   * Cryptographically sign a JWT with HMAC-SHA256
   */
  public static sign(options: SignTokenOptions, secret = ENV.JWT_SECRET): string {
    const now = Math.floor(Date.now() / 1000);
    const exp = now + (options.expiresInSeconds ?? this.DEFAULT_EXPIRY_SECONDS);

    const payload: JwtPayload = {
      sub: options.sub,
      role: options.role,
      email: options.email,
      name: options.name,
      departmentId: options.departmentId,
      iat: now,
      exp,
    };

    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const signingInput = `${this.HEADER}.${encodedPayload}`;

    const signature = crypto
      .createHmac('sha256', secret)
      .update(signingInput)
      .digest();

    const encodedSignature = base64UrlEncode(signature);
    return `${signingInput}.${encodedSignature}`;
  }

  /**
   * Verify and decode a JWT using constant-time comparison
   * Rejects missing, expired, invalid, or tampered tokens.
   */
  public static verify(token: string, secret = ENV.JWT_SECRET): JwtPayload {
    if (!token || typeof token !== 'string') {
      throw new AppError('Authentication token is missing.', 401);
    }

    const parts = token.trim().split('.');
    if (parts.length !== 3) {
      throw new AppError('Invalid token format: must be a 3-part signed JWT.', 401);
    }

    const [headerB64, payloadB64, signatureB64] = parts;

    // Verify header algorithm
    try {
      const headerJson = JSON.parse(base64UrlDecode(headerB64).toString('utf8'));
      if (headerJson.alg !== 'HS256' || headerJson.typ !== 'JWT') {
        throw new AppError('Unsupported token algorithm or type.', 401);
      }
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      throw new AppError('Malformed token header.', 401);
    }

    // Verify cryptographic signature with timingSafeEqual
    const signingInput = `${headerB64}.${payloadB64}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signingInput)
      .digest();

    const providedSignature = base64UrlDecode(signatureB64);

    if (
      expectedSignature.length !== providedSignature.length ||
      !crypto.timingSafeEqual(expectedSignature, providedSignature)
    ) {
      throw new AppError('Invalid token signature: token has been tampered with or corrupted.', 401);
    }

    // Parse payload
    let payload: JwtPayload;
    try {
      payload = JSON.parse(base64UrlDecode(payloadB64).toString('utf8'));
    } catch {
      throw new AppError('Malformed token payload.', 401);
    }

    // Verify expiration
    const now = Math.floor(Date.now() / 1000);
    if (!payload.exp || now >= payload.exp) {
      throw new AppError('Authentication token has expired. Please re-authenticate.', 401);
    }

    // Verify role integrity
    if (!['citizen', 'officer', 'admin'].includes(payload.role)) {
      throw new AppError('Invalid user role specified in token claims.', 403);
    }

    return payload;
  }

  /**
   * Decode token claims without signature verification (read-only inspection)
   */
  public static decode(token: string): JwtPayload | null {
    try {
      const parts = token.trim().split('.');
      if (parts.length !== 3) return null;
      return JSON.parse(base64UrlDecode(parts[1]).toString('utf8'));
    } catch {
      return null;
    }
  }
}
