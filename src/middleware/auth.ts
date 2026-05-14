/**
 * Authentication Middleware
 * Handles JWT verification and user context
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWTPayload, UserRole } from '../core/types';
import logger from '../utils/logger';

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload & { id: string };
      token?: string;
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Missing or invalid authorization header',
        timestamp: new Date(),
      });
      return;
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix
    const secret = process.env.JWT_SECRET || 'your-secret-key';

    const decoded = jwt.verify(token, secret) as JWTPayload;
    req.user = { ...decoded, id: decoded.sub };
    req.token = token;

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      error: error instanceof jwt.JsonWebTokenError ? error.message : 'Authentication failed',
      timestamp: new Date(),
    });
  }
};

/**
 * Optional auth middleware - doesn't fail if token is missing
 */
export const optionalAuthMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const secret = process.env.JWT_SECRET || 'your-secret-key';
      const decoded = jwt.verify(token, secret) as JWTPayload;
      req.user = { ...decoded, id: decoded.sub };
      req.token = token;
    }
  } catch (error) {
    logger.debug('Optional auth failed (acceptable):', error);
  }
  next();
};

/**
 * Role-based access control middleware
 */
export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        timestamp: new Date(),
      });
      return;
    }

    if (!roles.includes(req.user.role as UserRole)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        timestamp: new Date(),
      });
      return;
    }

    next();
  };
};

/**
 * Generate JWT token
 */
export const generateToken = (payload: JWTPayload): string => {
  const secret = process.env.JWT_SECRET || 'your-secret-key';
  const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Verify and decode JWT token
 */
export const verifyToken = (token: string): JWTPayload | null => {
  try {
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    return jwt.verify(token, secret) as JWTPayload;
  } catch {
    return null;
  }
};
