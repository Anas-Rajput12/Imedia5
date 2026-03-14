/**
 * Database Configuration
 * Uses Neon PostgreSQL with TypeORM
 */

import { DataSource } from 'typeorm';
import dotenv from 'dotenv';

dotenv.config();

// ⚠️ Make sure your .env has DATABASE_URL without ?sslmode=require
const DATABASE_URL = process.env.DATABASE_URL || 
  'postgresql://neondb_owner:YOUR_PASSWORD@ep-frosty-sunset-aberfve2-pooler.eu-west-2.aws.neon.tech/neondb';

export const AppDataSource = new DataSource({
  type: 'postgres',

  url: DATABASE_URL,

  // ✅ REQUIRED for Neon
  ssl: {
    rejectUnauthorized: false,
  },

  synchronize: false, // keep false in production
  logging: process.env.NODE_ENV === 'development',

  // ⚠️ Make sure this path matches your actual entity folder
  entities: ['src/models/**/*.ts'],

  migrations: ['src/migrations/**/*.ts'],
  subscribers: [],

  // ✅ Optimized pooling for Neon serverless
  extra: {
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 15000,
  },
});

// Initialize database connection
export async function initializeDatabase(): Promise<void> {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

// Graceful shutdown
export async function closeDatabase(): Promise<void> {
  try {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('Database connection closed');
    }
  } catch (error) {
    console.error('Error closing database:', error);
  }
}