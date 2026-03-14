/**
 * Authentication API Routes
 * Clerk integration for user authentication
 */

import { Router, Request, Response } from 'express';
import { verifyClerkAuth, optionalAuth } from '../middleware/auth';
import { asyncHandler, BadRequestError } from '../middleware/errorHandler';
import { AppDataSource } from '../config/database';
import { User, StudentProfile } from '../models';

const router = Router();

interface AuthRequest extends Request {
  userId?: string;
  clerkUser?: any;
}

/**
 * @route   GET /auth/me
 * @desc    Get current user profile from Clerk and sync with local DB
 * @access  Private
 */
router.get(
  '/me',
  verifyClerkAuth,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.userId;
    const clerkUser = req.clerkUser;

    if (!userId) {
      throw new BadRequestError('User ID not found');
    }

    // Extract user information from Clerk data
    const email = clerkUser?.primary_email_address_id || clerkUser?.email || '';
    const firstName = clerkUser?.first_name || '';
    const lastName = clerkUser?.last_name || '';

    // Get database connection
    const userRepo = AppDataSource.getRepository(User);
    const studentProfileRepo = AppDataSource.getRepository(StudentProfile);

    // Check if user exists in local database
    let localUser = await userRepo.findOne({
      where: { email },
      relations: ['profiles'],
    });

    // Create user if doesn't exist
    if (!localUser) {
      localUser = userRepo.create({
        email,
        password: '', // No password since Clerk handles auth
        first_name: firstName,
        last_name: lastName,
        year_group: 5,
        is_active: true,
      });

      await userRepo.save(localUser);

      // Create student profile
      const studentProfile = studentProfileRepo.create({
        student_id: `student_${userId}`,
        clerk_user_id: userId,
        user_id: localUser.id,
        first_name: firstName,
        last_name: lastName,
        email,
        year_group: 5,
        is_active: true,
      });

      await studentProfileRepo.save(studentProfile);
    }

    // Return user response
    res.json({
      success: true,
      data: {
        id: userId,
        email: localUser.email,
        first_name: localUser.first_name,
        last_name: localUser.last_name,
        year_group: localUser.year_group,
      },
    });
  })
);

/**
 * @route   GET /auth/verify
 * @desc    Verify authentication token
 * @access  Private
 */
router.get(
  '/verify',
  verifyClerkAuth,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    res.json({
      success: true,
      authenticated: true,
      userId: req.userId,
    });
  })
);

export default router;
