/**
 * Database Migration Script
 * Creates all database tables
 */

import 'reflect-metadata';
import { AppDataSource } from '../config/database';

async function runMigration() {
  try {
    console.log('🚀 Starting database migration...');

    // Initialize database connection with synchronize enabled
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    // Synchronize schema (creates tables if they don't exist)
    console.log('🔨 Synchronizing schema...');
    await AppDataSource.synchronize();
    console.log('✅ Schema synchronized');

    // Close connection
    await AppDataSource.destroy();
    console.log('✅ Migration completed');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
