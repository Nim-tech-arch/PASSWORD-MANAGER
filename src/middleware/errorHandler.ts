/**
 * Error Handling Middleware
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { ApiResponse } from '../core/types';

export class ApiError extends Error {
  constructor(public statusCode: number, message: string, public errors?: any[]) {
    super(message);
    this.name = 'ApiError';
  }
}

export const errorHandler = (
  error: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error('Error:', error);

  if (error instanceof ApiError) {
    res.status(error.statusCode).json({
      success: false,
      error: error.message,
      errors: error.errors,
      timestamp: new Date(),
    } as ApiResponse<null>);
    return;
  }

  // Default error response
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    timestamp: new Date(),
  } as ApiResponse<null>);
};

/**
 * Async handler wrapper for Express route handlers
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
