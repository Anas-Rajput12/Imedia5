/**
 * CORS Configuration
 */

import { CorsOptions } from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

export const corsOptions: CorsOptions = {
  origin: [
    frontendUrl,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    // Add production URLs here
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Authorization'],
  maxAge: 86400, // 24 hours
};
