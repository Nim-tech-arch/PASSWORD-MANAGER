/**
 * Password Routes - v1
 * All endpoints require authentication and implement user isolation
 */

import { Router, Request, Response } from 'express';
import { passwordService } from '../../services/PasswordService';
import { authMiddleware } from '../../middleware/auth';
import { passwordLimiter } from '../../middleware/rateLimiter';
import { asyncHandler, ApiError } from '../../middleware/errorHandler';
import {
  validate,
  passwordEntrySchema,
  passwordUpdateSchema,
  paginationSchema,
} from '../../core/validation';
import { PasswordEntry, ApiResponse } from '../../core/types';

const router = Router();

// All password routes require authentication
router.use(authMiddleware);

/**
 * POST /api/v1/passwords
 * Create a new password entry
 */
router.post(
  '/',
  passwordLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const data = validate(req.body, passwordEntrySchema);

    const password = await passwordService.createPassword(req.user!.id, data);

    res.status(201).json({
      success: true,
      data: password,
      timestamp: new Date(),
    } as ApiResponse<PasswordEntry>);
  })
);

/**
 * GET /api/v1/passwords
 * List user's passwords with pagination
 * NEVER returns all passwords - always requires pagination
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const query = validate(
      { ...req.query },
      paginationSchema
    );

    const page = query.page || 1;
    const pageSize = query.pageSize || 10;
    const search = query.search;

    const result = await passwordService.listPasswords(
      req.user!.id,
      page,
      pageSize,
      search
    );

    res.json({
      success: true,
      data: result,
      timestamp: new Date(),
    } as ApiResponse<any>);
  })
);

/**
 * GET /api/v1/passwords/:id
 * Get a specific password entry
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const password = await passwordService.getPassword(req.user!.id, id);

    if (!password) {
      throw new ApiError(404, 'Password entry not found');
    }

    res.json({
      success: true,
      data: password,
      timestamp: new Date(),
    } as ApiResponse<PasswordEntry>);
  })
);

/**
 * PATCH /api/v1/passwords/:id
 * Update a password entry
 */
router.patch(
  '/:id',
  passwordLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = validate(req.body, passwordUpdateSchema);

    const password = await passwordService.updatePassword(req.user!.id, id, updates);

    res.json({
      success: true,
      data: password,
      timestamp: new Date(),
    } as ApiResponse<PasswordEntry>);
  })
);

/**
 * DELETE /api/v1/passwords/:id
 * Delete a password entry
 */
router.delete(
  '/:id',
  passwordLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    await passwordService.deletePassword(req.user!.id, id);

    res.json({
      success: true,
      data: { message: 'Password entry deleted successfully' },
      timestamp: new Date(),
    } as ApiResponse<null>);
  })
);

export default router;
