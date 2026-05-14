/**
 * Authentication Routes - v1
 */

import { Router, Request, Response } from 'express';
import { authService } from '../services/AuthService';
import { authMiddleware } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimiter';
import { asyncHandler, ApiError } from '../middleware/errorHandler';
import { validate, userRegistrationSchema, userLoginSchema } from '../core/validation';
import { AuthCredentials, AuthTokens, ApiResponse } from '../core/types';

const router = Router();

/**
 * POST /api/v1/auth/register
 * Register a new user
 */
router.post(
  '/register',
  authLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = validate(req.body, userRegistrationSchema);

    const user = await authService.register(email, password);

    res.status(201).json({
      success: true,
      data: user.getPublicProfile(),
      timestamp: new Date(),
    } as ApiResponse<any>);
  })
);

/**
 * POST /api/v1/auth/login
 * Login user and get JWT token
 */
router.post(
  '/login',
  authLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const credentials = validate<AuthCredentials>(req.body, userLoginSchema);

    const { user, tokens } = await authService.login(credentials);

    res.json({
      success: true,
      data: {
        user: user.getPublicProfile(),
        tokens,
      },
      timestamp: new Date(),
    } as ApiResponse<any>);
  })
);

/**
 * GET /api/v1/auth/me
 * Get current user profile (requires authentication)
 */
router.get(
  '/me',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.getUserById(req.user!.id);

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    res.json({
      success: true,
      data: user.getPublicProfile(),
      timestamp: new Date(),
    } as ApiResponse<any>);
  })
);

/**
 * POST /api/v1/auth/change-password
 * Change user password (requires authentication)
 */
router.post(
  '/change-password',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new ApiError(400, 'Current and new password are required');
    }

    if (newPassword.length < 12) {
      throw new ApiError(400, 'New password must be at least 12 characters');
    }

    const user = await authService.getUserById(req.user!.id);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Verify current password
    const bcryptjs = require('bcryptjs');
    const isPasswordValid = await bcryptjs.compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new ApiError(401, 'Current password is incorrect');
    }

    await authService.updatePassword(req.user!.id, newPassword);

    res.json({
      success: true,
      data: { message: 'Password changed successfully' },
      timestamp: new Date(),
    } as ApiResponse<any>);
  })
);

/**
 * POST /api/v1/auth/logout
 * Logout user (client-side token removal)
 */
router.post(
  '/logout',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    res.json({
      success: true,
      data: { message: 'Logged out successfully' },
      timestamp: new Date(),
    } as ApiResponse<any>);
  })
);

export default router;
