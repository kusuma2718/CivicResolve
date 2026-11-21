import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { ENV } from './config/env.js';
import { initDatabase } from './db/schema.js';
import { db } from './db/index.js';
import apiRouter from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { securityHeadersMiddleware, apiGeneralLimiter } from './middlewares/security.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Locate frontend production build directory (root project dist)
const candidateDistDirs = [
  path.resolve(__dirname, '../../dist'),
  path.resolve(process.cwd(), '../dist'),
  path.resolve(process.cwd(), 'dist'),
];
const clientDistPath = candidateDistDirs.find((dir) => fs.existsSync(path.join(dir, 'index.html'))) || candidateDistDirs[0];

const app = express();

// Trust reverse proxy (e.g. Nginx, Cloudflare) loopback headers for secure IP determination
app.set('trust proxy', ENV.TRUST_PROXY);

// Initialize database schema and default seeds safely
initDatabase();

// Security headers — applied before all other middleware
app.use(securityHeadersMiddleware);

// CORS Configuration
const corsOrigins: (string | RegExp)[] = [ENV.CLIENT_URL];
if (ENV.NODE_ENV !== 'production') {
  corsOrigins.push('http://localhost:5173', 'http://127.0.0.1:5173');
}

app.use(
  cors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-role'],
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded static files
app.use('/uploads', express.static(path.resolve(ENV.UPLOAD_DIR)));
app.use('/uploads', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: `File '${req.path}' not found in uploads.`,
      statusCode: 404,
      timestamp: new Date().toISOString(),
    },
  });
});

// Global API rate limiter
app.use('/api', apiGeneralLimiter);

// Mount API routes
app.use('/api', apiRouter);

// Serve frontend production build assets from root project dist directory
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
}

// SPA Fallback: Serve dist/index.html for frontend routes without intercepting /api or /uploads
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return next();
  }
  const indexPath = path.join(clientDistPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  next();
});

// Centralized error handling middleware
app.use(errorHandler);

const server = app.listen(ENV.PORT, () => {
  console.log(`[CivicResolve Server] Running in ${ENV.NODE_ENV} mode on port ${ENV.PORT}`);
  console.log(`[CivicResolve Server] API base URL: http://localhost:${ENV.PORT}/api`);
});

// Graceful shutdown handler
function gracefulShutdown(signal: string) {
  console.log(`[CivicResolve Server] ${signal} received. Shutting down gracefully...`);
  server.close(() => {
    try {
      db.close();
      console.log('[CivicResolve Server] SQLite connection closed.');
    } catch {
      // DB may already be closed or not initialized
    }
    console.log('[CivicResolve Server] Process exited cleanly.');
    process.exit(0);
  });

  // Force exit after 10 seconds if graceful shutdown stalls
  setTimeout(() => {
    console.error('[CivicResolve Server] Forced shutdown after timeout.');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
