import crypto from 'node:crypto';

/**
 * Secure password hashing service using Node.js native crypto.scrypt
 * Zero external dependencies. Uses cryptographically secure salt and timing-safe comparison.
 */
export class PasswordService {
  private static readonly KEY_LEN = 64;

  /**
   * Hash a plaintext password with a random 16-byte salt using scrypt
   * Output format: scrypt:<salt_hex>:<hash_hex>
   */
  public static hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const derivedKey = crypto.scryptSync(password, salt, this.KEY_LEN);
    return `scrypt:${salt}:${derivedKey.toString('hex')}`;
  }

  /**
   * Verify candidate password against stored scrypt hash using timingSafeEqual
   */
  public static verifyPassword(password: string, storedHash: string): boolean {
    if (!storedHash || !storedHash.startsWith('scrypt:')) {
      return false;
    }

    const parts = storedHash.split(':');
    if (parts.length !== 3) {
      return false;
    }

    const [, salt, expectedHashHex] = parts;
    const expectedBuffer = Buffer.from(expectedHashHex, 'hex');
    const derivedBuffer = crypto.scryptSync(password, salt, this.KEY_LEN);

    if (expectedBuffer.length !== derivedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, derivedBuffer);
  }
}
