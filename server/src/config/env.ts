import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const ENV = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  DATABASE_PATH: process.env.DATABASE_PATH || './data/civicresolve.db',
  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
  MAX_FILE_SIZE_MB: process.env.MAX_FILE_SIZE_MB ? parseInt(process.env.MAX_FILE_SIZE_MB, 10) : 10,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  JWT_SECRET: process.env.JWT_SECRET || 'civicresolve_dev_jwt_secret_change_in_production_min32chars!',
  TRUST_PROXY: process.env.TRUST_PROXY || 'loopback',
  BACKUP_DIR: process.env.BACKUP_DIR || './backups',
};
