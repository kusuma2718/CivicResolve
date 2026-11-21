/**
 * CivicResolve Database Backup CLI
 * Can be scheduled via cron or run manually before deployments.
 * Usage: npx tsx src/scripts/backupCli.ts
 */

import { BackupService } from '../services/backupService.js';

async function main() {
  console.log('[CivicResolve Backup] Starting SQLite online WAL backup...');
  try {
    const result = await BackupService.createBackup();
    console.log(`[CivicResolve Backup] Backup successfully created!`);
    console.log(`  File: ${result.filename}`);
    console.log(`  Path: ${result.backupPath}`);
    console.log(`  Size: ${(result.sizeBytes / 1024).toFixed(2)} KB`);
    console.log(`  Timestamp: ${result.timestamp}`);

    const verification = BackupService.verifyBackup(result.backupPath);
    console.log(`[CivicResolve Backup] Integrity Check: ${verification.integrity}`);
    console.log(`  Complaints: ${verification.complaintCount}`);
    console.log(`  Users: ${verification.userCount}`);

    process.exit(0);
  } catch (err) {
    console.error('[CivicResolve Backup Error]', err);
    process.exit(1);
  }
}

main();
