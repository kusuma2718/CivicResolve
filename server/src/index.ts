import express from 'express';
import cors from 'cors';
import path from 'path';
import { ENV } from './config/env.js';
import { initDatabase } from './db/schema.js';
import { db } from './db/index.js';
import apiRouter from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { securityHeadersMiddleware, apiGeneralLimiter } from './middlewares/security.js';

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

// Global API rate limiter
app.use('/api', apiGeneralLimiter);

// Mount API routes
app.use('/api', apiRouter);

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
