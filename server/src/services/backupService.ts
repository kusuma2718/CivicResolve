import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';
import { db } from '../db/index.js';
import { ENV } from '../config/env.js';
import { AppError } from '../middlewares/errorHandler.js';

export interface BackupResult {
  success: boolean;
  backupPath: string;
  filename: string;
  sizeBytes: number;
  timestamp: string;
}

export interface BackupFileInfo {
  filename: string;
  fullPath: string;
  sizeBytes: number;
  createdAt: string;
}

export interface VerifyBackupResult {
  valid: boolean;
  integrity: string;
  complaintCount: number;
  userCount: number;
  fileSizeBytes: number;
}

export class BackupService {
  /**
   * Perform an atomic SQLite online backup compatible with WAL mode.
   * Never overwrites existing backup files.
   */
  public static async createBackup(customDir?: string): Promise<BackupResult> {
    const backupDir = path.resolve(customDir || ENV.BACKUP_DIR);
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const now = new Date();
    // Format timestamp YYYY-MM-DDTHH-mm-ss
    const timestampStr = now.toISOString().replace(/[:.]/g, '-');
    let filename = `civicresolve-backup-${timestampStr}.db`;
    let backupPath = path.join(backupDir, filename);

    // Collision prevention: If file exists, append a random entropy salt
    if (fs.existsSync(backupPath)) {
      const salt = Math.random().toString(36).substring(2, 8);
      filename = `civicresolve-backup-${timestampStr}-${salt}.db`;
      backupPath = path.join(backupDir, filename);
    }

    // SQLite online backup API: locks safely in WAL mode, drains pages atomically
    await db.backup(backupPath);

    const stats = fs.statSync(backupPath);

    return {
      success: true,
      backupPath,
      filename,
      sizeBytes: stats.size,
      timestamp: now.toISOString(),
    };
  }

  /**
   * List all timestamped backups in the backup directory
   */
  public static listBackups(customDir?: string): BackupFileInfo[] {
    const backupDir = path.resolve(customDir || ENV.BACKUP_DIR);
    if (!fs.existsSync(backupDir)) {
      return [];
    }

    const files = fs.readdirSync(backupDir);
    const backupFiles: BackupFileInfo[] = [];

    for (const f of files) {
      if (f.endsWith('.db') && f.startsWith('civicresolve-backup-')) {
        const fullPath = path.join(backupDir, f);
        try {
          const stat = fs.statSync(fullPath);
          backupFiles.push({
            filename: f,
            fullPath,
            sizeBytes: stat.size,
            createdAt: stat.birthtime.toISOString(),
          });
        } catch {
          // ignore stat errors
        }
      }
    }

    return backupFiles.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  /**
   * Verify backup integrity using SQLite PRAGMA integrity_check
   */
  public static verifyBackup(backupFilePath: string): VerifyBackupResult {
    const resolvedPath = path.resolve(backupFilePath);
    if (!fs.existsSync(resolvedPath)) {
      throw new AppError(`Backup file not found at ${resolvedPath}`, 404);
    }

    let backupDb: Database.Database | null = null;
    try {
      backupDb = new Database(resolvedPath, { readonly: true, fileMustExist: true });

      const integrityRow = backupDb.prepare('PRAGMA integrity_check').get() as { integrity_check?: string } | undefined;
      const integrity = integrityRow?.integrity_check || 'unknown';

      const complaintRow = backupDb.prepare('SELECT count(*) as count FROM complaints').get() as { count: number };
      const userRow = backupDb.prepare('SELECT count(*) as count FROM users').get() as { count: number };

      const stat = fs.statSync(resolvedPath);

      return {
        valid: integrity.toLowerCase() === 'ok',
        integrity,
        complaintCount: complaintRow.count,
        userCount: userRow.count,
        fileSizeBytes: stat.size,
      };
    } finally {
      if (backupDb) {
        backupDb.close();
      }
    }
  }

  /**
   * Restore a backup file to a target database destination.
   * Safety rule: Requires explicit targetPath to prevent unintended destruction of the live database.
   */
  public static restoreBackup(
    backupFilePath: string,
    targetPath: string
  ): { restored: boolean; targetPath: string; verified: boolean; complaintCount: number } {
    const sourceResolved = path.resolve(backupFilePath);
    const targetResolved = path.resolve(targetPath);

    if (!fs.existsSync(sourceResolved)) {
      throw new AppError(`Source backup file not found: ${sourceResolved}`, 404);
    }

    // Verify source before attempting restore
    const sourceVerification = this.verifyBackup(sourceResolved);
    if (!sourceVerification.valid) {
      throw new AppError(`Source backup file failed integrity check: ${sourceVerification.integrity}`, 400);
    }

    // Ensure target directory exists
    const targetDir = path.dirname(targetResolved);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Crucial for SQLite WAL recovery: Clean up existing sidecar WAL and SHM files
    // to prevent stale WAL transactions from replaying over or corrupting the restored database.
    const targetWal = `${targetResolved}-wal`;
    const targetShm = `${targetResolved}-shm`;
    if (fs.existsSync(targetWal)) {
      try { fs.unlinkSync(targetWal); } catch {}
    }
    if (fs.existsSync(targetShm)) {
      try { fs.unlinkSync(targetShm); } catch {}
    }

    // Copy backup file to target location
    fs.copyFileSync(sourceResolved, targetResolved);

    // Verify target file opens and integrity check passes
    const targetVerification = this.verifyBackup(targetResolved);

    return {
      restored: true,
      targetPath: targetResolved,
      verified: targetVerification.valid,
      complaintCount: targetVerification.complaintCount,
    };
  }
}
