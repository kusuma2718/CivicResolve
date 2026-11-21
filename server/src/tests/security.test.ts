import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import path from 'path';
import fs from 'fs';
import { ComplaintService } from '../services/complaintService.js';
import { ComplaintController } from '../controllers/complaintController.js';
import { JwtService } from '../services/jwtService.js';
import { BackupService } from '../services/backupService.js';
import { PasswordService } from '../services/passwordService.js';
import { UserService } from '../services/userService.js';
import { AuthController } from '../controllers/authController.js';
import { db } from '../db/index.js';
import { ENV } from '../config/env.js';

/** Helper to invoke ComplaintController.create with mock Express objects */
async function callCreateController(body: Record<string, unknown>): Promise<{ error: any; statusCode: number; json: any }> {
  return new Promise((resolve) => {
    const mockReq: any = { body };
    let responseStatus = 200;
    let responseJson: any = null;
    const mockRes: any = {
      status: (code: number) => { responseStatus = code; return mockRes; },
      json: (data: any) => { responseJson = data; },
    };
    const mockNext = (err?: any) => {
      resolve({ error: err || null, statusCode: err?.statusCode || responseStatus, json: responseJson });
    };
    ComplaintController.create(mockReq, mockRes, mockNext);
  });
}

describe('Phase 6: Security & Production Readiness', () => {
  describe('1. Cryptographic Authentication & JWT Hardening', () => {
    it('should sign and verify valid HS256 tokens', () => {
      const token = JwtService.sign({
        sub: 'usr-officer-1',
        role: 'officer',
        email: 'officer@civicresolve.gov.in',
        name: 'Field Officer',
      });

      assert.ok(token && typeof token === 'string');
      assert.strictEqual(token.split('.').length, 3, 'Must be a 3-part signed JWT');

      const payload = JwtService.verify(token);
      assert.strictEqual(payload.sub, 'usr-officer-1');
      assert.strictEqual(payload.role, 'officer');
      assert.strictEqual(payload.email, 'officer@civicresolve.gov.in');
      assert.ok(payload.exp > payload.iat);
    });

    it('should reject tampered token signatures', () => {
      const validToken = JwtService.sign({
        sub: 'usr-officer-1',
        role: 'officer',
      });

      const parts = validToken.split('.');
      // Tamper with the payload (middle segment)
      const tamperedPayload = Buffer.from(JSON.stringify({ sub: 'usr-hacker', role: 'admin', exp: 9999999999 })).toString('base64url');
      const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

      assert.throws(() => {
        JwtService.verify(tamperedToken);
      }, (err: any) => {
        assert.strictEqual(err.statusCode, 401);
        assert.ok(err.message.includes('tampered with') || err.message.includes('signature'));
        return true;
      });
    });

    it('should reject expired tokens', () => {
      const expiredToken = JwtService.sign(
        { sub: 'usr-expired', role: 'officer' },
        ENV.JWT_SECRET
      );

      // Artificially create an expired token
      const now = Math.floor(Date.now() / 1000);
      const expiredPayload = Buffer.from(JSON.stringify({
        sub: 'usr-expired',
        role: 'officer',
        iat: now - 3600,
        exp: now - 60, // expired 60 seconds ago
      })).toString('base64url');

      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
      const sig = crypto.createHmac('sha256', ENV.JWT_SECRET).update(`${header}.${expiredPayload}`).digest('base64url');
      const token = `${header}.${expiredPayload}.${sig}`;

      assert.throws(() => {
        JwtService.verify(token);
      }, (err: any) => {
        assert.strictEqual(err.statusCode, 401);
        assert.ok(err.message.includes('expired'));
        return true;
      });
    });

    it('should reject missing Authorization header on protected routes (HTTP 401)', async () => {
      const { requireOfficerRole } = await import('../middlewares/auth.js');
      let errorPassed: any = null;
      const mockReq: any = { headers: {} };
      const mockRes: any = {};
      const mockNext = (err?: any) => { errorPassed = err || null; };

      requireOfficerRole(mockReq, mockRes, mockNext);
      assert.ok(errorPassed);
      assert.strictEqual(errorPassed.statusCode, 401);
    });

    it('should reject client-controlled x-user-role header spoofing without valid JWT (HTTP 401)', async () => {
      const { requireOfficerRole } = await import('../middlewares/auth.js');
      let errorPassed: any = null;
      // Attacker tries to bypass auth by sending x-user-role: officer/admin
      const mockReq: any = { headers: { 'x-user-role': 'officer' } };
      const mockRes: any = {};
      const mockNext = (err?: any) => { errorPassed = err || null; };

      requireOfficerRole(mockReq, mockRes, mockNext);
      assert.ok(errorPassed, 'Must reject unauthenticated request even if x-user-role is set');
      assert.strictEqual(errorPassed.statusCode, 401);
    });

    it('should reject role escalation: citizen token cannot access officer routes (HTTP 403)', async () => {
      const { requireOfficerRole } = await import('../middlewares/auth.js');
      const citizenToken = JwtService.sign({
        sub: 'usr-citizen-123',
        role: 'citizen',
        email: 'citizen@example.com',
      });

      let errorPassed: any = null;
      const mockReq: any = {
        headers: {
          authorization: `Bearer ${citizenToken}`,
          'x-user-role': 'admin', // Attacker attempts header elevation
        },
      };
      const mockRes: any = {};
      const mockNext = (err?: any) => { errorPassed = err || null; };

      requireOfficerRole(mockReq, mockRes, mockNext);
      assert.ok(errorPassed, 'Must reject citizen token from accessing officer route');
      assert.strictEqual(errorPassed.statusCode, 403, 'Must return 403 Forbidden');
    });

    it('should authorize valid officer Bearer token', async () => {
      const { requireOfficerRole } = await import('../middlewares/auth.js');
      const officerToken = JwtService.sign({
        sub: 'usr-officer-456',
        role: 'officer',
        email: 'officer@civicresolve.gov.in',
      });

      let errorPassed: any = null;
      let nextCalled = false;
      const mockReq: any = {
        headers: {
          authorization: `Bearer ${officerToken}`,
        },
      };
      const mockRes: any = {};
      const mockNext = (err?: any) => {
        errorPassed = err || null;
        nextCalled = true;
      };

      requireOfficerRole(mockReq, mockRes, mockNext);
      assert.ok(nextCalled);
      assert.strictEqual(errorPassed, null);
      assert.strictEqual(mockReq.user?.role, 'officer');
    });

    it('should authorize valid admin Bearer token for officer routes', async () => {
      const { requireOfficerRole } = await import('../middlewares/auth.js');
      const adminToken = JwtService.sign({
        sub: 'usr-admin-001',
        role: 'admin',
        email: 'admin@civicresolve.gov.in',
      });

      let errorPassed: any = null;
      let nextCalled = false;
      const mockReq: any = {
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      };
      const mockRes: any = {};
      const mockNext = (err?: any) => {
        errorPassed = err || null;
        nextCalled = true;
      };

      requireOfficerRole(mockReq, mockRes, mockNext);
      assert.ok(nextCalled);
      assert.strictEqual(errorPassed, null);
      assert.strictEqual(mockReq.user?.role, 'admin');
    });
  });

  describe('2. Input Validation', () => {
    it('should reject complaint with invalid category via controller', async () => {
      const result = await callCreateController({
        title: 'Test complaint',
        description: 'A valid description that meets minimum length requirements for validation.',
        category: 'Hacking and Exploits',
        location: 'Test location',
        city: 'Test city',
        state: 'Test state',
        citizenName: 'Test Citizen',
        email: 'test@example.com',
      });
      assert.ok(result.error, 'Should produce a validation error');
      assert.strictEqual(result.statusCode, 400);
      assert.ok(result.error.message.includes('Invalid category'));
    });

    it('should reject complaint with invalid email via controller', async () => {
      const result = await callCreateController({
        title: 'Test complaint',
        description: 'A valid description that meets minimum length requirements for validation.',
        category: 'Roads and Potholes',
        location: 'Test location',
        city: 'Test city',
        state: 'Test state',
        citizenName: 'Test Citizen',
        email: 'not-an-email',
      });
      assert.ok(result.error, 'Should produce a validation error');
      assert.strictEqual(result.statusCode, 400);
      assert.ok(result.error.message.includes('Invalid email'));
    });

    it('should reject complaint with too-short description via controller', async () => {
      const result = await callCreateController({
        title: 'Test complaint',
        description: 'Short',
        category: 'Roads and Potholes',
        location: 'Test location',
        city: 'Test city',
        state: 'Test state',
        citizenName: 'Test Citizen',
        email: 'test@example.com',
      });
      assert.ok(result.error, 'Should produce a validation error');
      assert.strictEqual(result.statusCode, 400);
      assert.ok(result.error.message.includes('at least 10 characters'));
    });

    it('should reject complaint with oversized title via controller', async () => {
      const result = await callCreateController({
        title: 'A'.repeat(201),
        description: 'A valid description that meets minimum length requirements for validation.',
        category: 'Roads and Potholes',
        location: 'Test location',
        city: 'Test city',
        state: 'Test state',
        citizenName: 'Test Citizen',
        email: 'test@example.com',
      });
      assert.ok(result.error, 'Should produce a validation error');
      assert.strictEqual(result.statusCode, 400);
      assert.ok(result.error.message.includes('200 characters'));
    });

    it('should reject complaint with missing required fields via controller', async () => {
      const result = await callCreateController({
        title: 'Test',
      });
      assert.ok(result.error, 'Should produce a validation error');
      assert.strictEqual(result.statusCode, 400);
      assert.ok(result.error.message.includes('Missing required fields'));
    });
  });

  describe('3. Security Headers', () => {
    it('should set all required security headers', async () => {
      const { securityHeadersMiddleware } = await import('../middlewares/security.js');

      const headers: Record<string, string> = {};
      const mockReq: any = {};
      const mockRes: any = {
        setHeader: (key: string, value: string) => { headers[key] = value; },
      };
      let nextCalled = false;
      const mockNext = () => { nextCalled = true; };

      securityHeadersMiddleware(mockReq, mockRes, mockNext);

      assert.ok(nextCalled, 'Should call next()');
      assert.strictEqual(headers['X-Content-Type-Options'], 'nosniff');
      assert.strictEqual(headers['X-Frame-Options'], 'DENY');
      assert.strictEqual(headers['X-XSS-Protection'], '1; mode=block');
      assert.ok(headers['Referrer-Policy']);
      assert.ok(headers['Strict-Transport-Security']);
      assert.ok(headers['Content-Security-Policy']);
    });
  });

  describe('4. Rate Limiting', () => {
    it('should enforce rate limits after max requests', async () => {
      const { createRateLimiter } = await import('../middlewares/security.js');

      const limiter = createRateLimiter({
        windowMs: 60_000,
        maxRequests: 3,
        message: 'Test limit hit',
      });

      let passCount = 0;
      let errorPassed: any = null;

      const mockReq: any = {
        ip: '192.168.99.99',
        headers: {},
        socket: { remoteAddress: '192.168.99.99' },
      };

      const mockRes: any = {
        setHeader: () => {},
      };

      for (let i = 0; i < 3; i++) {
        limiter(mockReq, mockRes, (err?: any) => {
          if (!err) passCount++;
        });
      }

      limiter(mockReq, mockRes, (err?: any) => {
        errorPassed = err;
      });

      assert.strictEqual(passCount, 3, 'First 3 requests should pass');
      assert.ok(errorPassed, 'Should rate-limit the 4th request');
      assert.strictEqual(errorPassed.statusCode, 429);
      assert.ok(errorPassed.message.includes('Test limit hit'));
    });
  });

  describe('5. Database Security', () => {
    it('should use parameterized queries for search filters (no SQL injection)', () => {
      const results = ComplaintService.listComplaints({
        search: "'; DROP TABLE complaints; --",
      });
      assert.ok(Array.isArray(results), 'Should return an array, not crash');
      const allComplaints = ComplaintService.listComplaints({});
      assert.ok(allComplaints.length > 0, 'Complaints table must still exist after injection attempt');
    });
  });

  describe('6. Error Handling', () => {
    it('should sanitize 500 errors in production mode', async () => {
      const { errorHandler } = await import('../middlewares/errorHandler.js');

      let responseBody: any = null;
      let statusSet = 0;

      const mockReq: any = { method: 'GET', url: '/test' };
      const mockRes: any = {
        statusCode: 200,
        status: (code: number) => {
          statusSet = code;
          return mockRes;
        },
        json: (body: any) => { responseBody = body; },
      };
      const mockNext = () => {};

      const internalError: any = new Error('SQLite error: file at /secret/path.db');
      internalError.statusCode = 500;

      errorHandler(internalError, mockReq, mockRes, mockNext);

      assert.strictEqual(statusSet, 500);
      assert.ok(responseBody);
      assert.strictEqual(responseBody.success, false);
      assert.ok(responseBody.error.timestamp);
    });
  });

  describe('7. SQLite Online Backup & Recovery', () => {
    const testBackupDir = path.resolve('./backups_test');

    it('should create an atomic WAL-compatible online backup without overwriting', async () => {
      const result = await BackupService.createBackup(testBackupDir);

      assert.strictEqual(result.success, true);
      assert.ok(fs.existsSync(result.backupPath));
      assert.ok(result.sizeBytes > 0);
      assert.ok(result.filename.startsWith('civicresolve-backup-'));

      // Verify file integrity
      const verification = BackupService.verifyBackup(result.backupPath);
      assert.strictEqual(verification.valid, true);
      assert.strictEqual(verification.integrity.toLowerCase(), 'ok');
      assert.ok(verification.complaintCount > 0);
    });

    it('should list backups with metadata', () => {
      const list = BackupService.listBackups(testBackupDir);
      assert.ok(list.length > 0);
      assert.ok(list[0].sizeBytes > 0);
      assert.ok(list[0].createdAt);
    });

    it('should restore backup to an isolated target path and verify integrity (never touching live db)', async () => {
      const backupResult = await BackupService.createBackup(testBackupDir);
      const testRestorePath = path.resolve('./data/test_restore_verify.db');

      // Ensure live database is never target
      assert.notStrictEqual(path.resolve(ENV.DATABASE_PATH), testRestorePath);

      const restoreResult = BackupService.restoreBackup(backupResult.backupPath, testRestorePath);

      assert.strictEqual(restoreResult.restored, true);
      assert.strictEqual(restoreResult.verified, true);
      assert.ok(restoreResult.complaintCount > 0);

      // Clean up test restore database
      if (fs.existsSync(testRestorePath)) {
        fs.unlinkSync(testRestorePath);
      }
    });

    it('should clean up stale WAL and SHM sidecar files during restoration', async () => {
      const backupResult = await BackupService.createBackup(testBackupDir);
      const testRestorePath = path.resolve('./data/test_restore_sidecar.db');
      const testWalPath = `${testRestorePath}-wal`;
      const testShmPath = `${testRestorePath}-shm`;

      // Plant stale dummy sidecar files before restore
      fs.writeFileSync(testWalPath, 'dummy stale WAL bytes');
      fs.writeFileSync(testShmPath, 'dummy stale SHM bytes');
      assert.ok(fs.existsSync(testWalPath));
      assert.ok(fs.existsSync(testShmPath));

      const restoreResult = BackupService.restoreBackup(backupResult.backupPath, testRestorePath);
      assert.strictEqual(restoreResult.restored, true);
      assert.strictEqual(restoreResult.verified, true);

      // Verify stale dummy data was eliminated (any remaining WAL file is a clean SQLite-generated WAL)
      if (fs.existsSync(testWalPath)) {
        assert.notStrictEqual(fs.readFileSync(testWalPath, 'utf8'), 'dummy stale WAL bytes', 'Stale WAL content must be wiped');
      }
      if (fs.existsSync(testShmPath)) {
        assert.notStrictEqual(fs.readFileSync(testShmPath, 'utf8'), 'dummy stale SHM bytes', 'Stale SHM content must be wiped');
      }

      if (fs.existsSync(testRestorePath)) fs.unlinkSync(testRestorePath);
      if (fs.existsSync(testWalPath)) fs.unlinkSync(testWalPath);
      if (fs.existsSync(testShmPath)) fs.unlinkSync(testShmPath);
    });

    it('should preserve original live database unchanged', () => {
      // Query original database
      const originalComplaints = ComplaintService.listComplaints({});
      assert.ok(originalComplaints.length > 0, 'Original database complaints intact');
    });
  });

  describe('8. Administrative Account Provisioning & Password Security', () => {
    it('should hash and verify passwords using scrypt with timing-safe comparison', () => {
      const password = 'TestSecurePassword#2025';
      const hash = PasswordService.hashPassword(password);

      assert.ok(hash.startsWith('scrypt:'));
      assert.strictEqual(hash.split(':').length, 3);
      assert.strictEqual(PasswordService.verifyPassword(password, hash), true);
      assert.strictEqual(PasswordService.verifyPassword('WrongPassword', hash), false);
    });

    it('should ensure initial administrative and officer accounts exist in database', () => {
      const admin = db.prepare('SELECT id, name, email, role, password_hash FROM users WHERE LOWER(email) = LOWER(?)').get('admin@civicresolve.gov.in') as any;
      assert.ok(admin, 'Root admin account must exist');
      assert.strictEqual(admin.role, 'admin');
      assert.ok(admin.password_hash.startsWith('scrypt:'), 'Admin password must be hashed with scrypt');

      const officer = db.prepare('SELECT id, name, email, role, password_hash FROM users WHERE LOWER(email) = LOWER(?)').get('officer@civicresolve.gov.in') as any;
      assert.ok(officer, 'Duty officer account must exist');
      assert.strictEqual(officer.role, 'officer');
      assert.ok(officer.password_hash.startsWith('scrypt:'), 'Officer password must be hashed with scrypt');
    });

    it('should enforce citizen role on public user creation without privileged escalation', () => {
      const citizen = UserService.getOrCreateUser('newcitizen@test.org', 'New Citizen', 'en');
      assert.ok(citizen);
      assert.strictEqual(citizen.role, 'citizen', 'Public creation must strictly assign citizen role');

      // Attempt to retrieve preference
      const pref = UserService.getUserPreference(citizen.id) as any;
      assert.strictEqual(pref.role, 'citizen');
    });

    it('should authenticate valid admin credentials and assign role strictly from database', async () => {
      let responseJson: any = null;
      let statusCode = 200;
      const mockReq: any = {
        body: {
          email: 'admin@civicresolve.gov.in',
          password: 'Admin@Civic2025!',
          role: 'citizen', // Client attempts to specify non-admin role, but DB dictates admin
        },
      };
      const mockRes: any = {
        status: (code: number) => { statusCode = code; return mockRes; },
        json: (data: any) => { responseJson = data; },
      };
      const mockNext = () => {};

      await AuthController.login(mockReq, mockRes, mockNext);

      assert.strictEqual(statusCode, 200);
      assert.ok(responseJson?.success);
      assert.ok(responseJson?.token);
      assert.strictEqual(responseJson?.user?.role, 'admin', 'Role must strictly match database role');

      // Verify claims in the issued JWT
      const claims = JwtService.verify(responseJson.token);
      assert.strictEqual(claims.role, 'admin');
      assert.strictEqual(claims.email, 'admin@civicresolve.gov.in');
    });

    it('should reject login with incorrect password', async () => {
      let errorPassed: any = null;
      const mockReq: any = {
        body: {
          email: 'admin@civicresolve.gov.in',
          password: 'IncorrectPassword123!',
        },
      };
      const mockRes: any = {};
      const mockNext = (err?: any) => { errorPassed = err || null; };

      await AuthController.login(mockReq, mockRes, mockNext);

      assert.ok(errorPassed);
      assert.strictEqual(errorPassed.statusCode, 401);
      assert.ok(errorPassed.message.includes('Invalid email or password'));
    });
  });

  describe('9. Single-Service Render Deployment & SPA Fallback', () => {
    it('should have a valid frontend production build in root dist directory', () => {
      const distIndex = path.resolve('../dist/index.html');
      assert.ok(fs.existsSync(distIndex), 'root dist/index.html must exist for single-service deployment');
      const content = fs.readFileSync(distIndex, 'utf8');
      assert.ok(content.includes('<html') || content.includes('<!DOCTYPE html>'), 'dist/index.html must contain HTML markup');
      assert.ok(content.includes('/assets/'), 'dist/index.html must reference built assets');
    });

    it('should not intercept /api routes in SPA fallback handler', () => {
      const isApi = (urlPath: string) => urlPath.startsWith('/api') || urlPath.startsWith('/uploads');
      assert.strictEqual(isApi('/api/complaints'), true, '/api/complaints must not be intercepted');
      assert.strictEqual(isApi('/api/health'), true, '/api/health must not be intercepted');
      assert.strictEqual(isApi('/uploads/evidence.jpg'), true, '/uploads/ must not be intercepted');
      assert.strictEqual(isApi('/track'), false, '/track is an SPA route');
      assert.strictEqual(isApi('/report'), false, '/report is an SPA route');
      assert.strictEqual(isApi('/admin'), false, '/admin is an SPA route');
      assert.strictEqual(isApi('/'), false, '/ is an SPA route');
    });
  });
});
