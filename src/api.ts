/**
 * Main API Server
 * Multi-User Password Manager API
 */

require('dotenv').config();
import 'reflect-metadata';
import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'express-async-errors';

import { initializeDatabase, closeDatabase } from './core/database';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';
import logger from './utils/logger';

// Import v1 routes
import authRoutes from './routes/v1/auth';
import passwordRoutes from './routes/v1/passwords';

// ============ Setup ============
const app: Express = express();
const PORT = process.env.PORT || 3000;

// ============ Middleware ============
app.use(helmet()); // Security headers
app.use(cors()); // CORS support
app.use(express.json()); // JSON parsing
app.use(express.urlencoded({ extended: true })); // URL encoded parsing

// Apply rate limiting to API routes
app.use('/api/', apiLimiter);

// ============ Health Check ============
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Password Manager API is running',
    timestamp: new Date(),
    version: '1.0.0',
    uptime: process.uptime(),
  });
});

// ============ API Routes v1 ============
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/passwords', passwordRoutes);

// ============ 404 Handler ============
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date(),
  });
});

// ============ Error Handler ============
app.use(errorHandler);

// ============ Server Startup ============
async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();

    // Start server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on http://localhost:${PORT}`);
      logger.info('📝 API Documentation:');
      logger.info('  POST   /api/v1/auth/register    - Register new user');
      logger.info('  POST   /api/v1/auth/login       - Login');
      logger.info('  GET    /api/v1/auth/me          - Get current user');
      logger.info('  POST   /api/v1/passwords         - Create password');
      logger.info('  GET    /api/v1/passwords         - List passwords');
      logger.info('  GET    /api/v1/passwords/:id    - Get password');
      logger.info('  PATCH  /api/v1/passwords/:id    - Update password');
      logger.info('  DELETE /api/v1/passwords/:id    - Delete password');
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM signal received: closing HTTP server');
      server.close(async () => {
        await closeDatabase();
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT signal received: closing HTTP server');
      server.close(async () => {
        await closeDatabase();
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
