/**
 * Clerk Authentication Middleware
 * Verifies JWT tokens from Clerk
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      clerkUser?: any;
    }
  }
}

/**
 * Middleware to verify Clerk JWT token
 */
export const verifyClerkAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ 
        success: false,
        message: 'No token provided' 
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!CLERK_SECRET_KEY) {
      console.warn('CLERK_SECRET_KEY not configured');
      // In development without Clerk, allow requests through
      req.userId = 'dev-user-id';
      req.clerkUser = { id: 'dev-user-id' };
      next();
      return;
    }

    // Verify JWT token
    const decoded = jwt.verify(token, CLERK_SECRET_KEY) as any;
    
    // Attach user info to request
    req.userId = decoded.sub || decoded.userId;
    req.clerkUser = decoded;

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ 
        success: false,
        message: 'Invalid token' 
      });
      return;
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ 
        success: false,
        message: 'Token expired' 
      });
      return;
    }

    res.status(500).json({ 
      success: false,
      message: 'Authentication error' 
    });
    return;
  }
};

/**
 * Optional authentication - doesn't fail if no token
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      if (CLERK_SECRET_KEY) {
        const decoded = jwt.verify(token, CLERK_SECRET_KEY) as any;
        req.userId = decoded.sub || decoded.userId;
        req.clerkUser = decoded;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};
