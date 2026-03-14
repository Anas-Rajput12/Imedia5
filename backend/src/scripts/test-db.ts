/**
 * Simple Database Connection Test
 */

import 'reflect-metadata';
import { AppDataSource } from '../config/database';

async function testConnection() {
  try {
    console.log('🔌 Testing database connection...');
    
    await AppDataSource.initialize();
    console.log('✅ Database connected successfully!');
    
    // Check if curriculum_topics table exists
    const queryRunner = AppDataSource.createQueryRunner();
    const tableExists = await queryRunner.hasTable('curriculum_topics');
    console.log(`📊 Table 'curriculum_topics' exists: ${tableExists}`);
    
    if (tableExists) {
      const count = await queryRunner.query('SELECT COUNT(*) FROM curriculum_topics');
      console.log(`📈 Total topics in database: ${count[0].count}`);
    } else {
      console.log('⚠️ Table does not exist. Creating...');
      await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS curriculum_topics (
          topic_id VARCHAR PRIMARY KEY,
          topic_name VARCHAR NOT NULL,
          subject VARCHAR NOT NULL,
          year_level INT NOT NULL,
          exam_board VARCHAR,
          description TEXT,
          learning_objectives JSONB,
          prerequisite_topics JSONB,
          estimated_duration_mins INT,
          content JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE
        )
      `);
      console.log('✅ Table created successfully');
    }
    
    await queryRunner.release();
    await AppDataSource.destroy();
    
    console.log('✅ Test completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    process.exit(1);
  }
}

testConnection();
