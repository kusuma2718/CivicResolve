import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { ENV } from '../config/env.js';

const dbDir = path.dirname(path.resolve(ENV.DATABASE_PATH));
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db: Database.Database = new Database(path.resolve(ENV.DATABASE_PATH));

// Enable WAL mode and foreign keys for reliable performance and integrity
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
