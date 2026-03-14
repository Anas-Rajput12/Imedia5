/**
 * Raw SQL Seed Script
 * Uses native pg client to insert topics
 */

import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_e3EpidRt7qcU@ep-frosty-sunset-aberfve2-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require';

async function seedRaw() {
  const client = new Client({ connectionString: DATABASE_URL });
  
  try {
    console.log('🌱 Connecting to database...');
    await client.connect();
    console.log('✅ Database connected');

    // Create curriculum_topics table if not exists
    console.log('📋 Creating curriculum_topics table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS curriculum_topics (
        topic_id VARCHAR(255) PRIMARY KEY,
        topic_name VARCHAR(255) NOT NULL,
        subject VARCHAR(100) NOT NULL,
        year_level INTEGER NOT NULL,
        exam_board VARCHAR(100),
        description TEXT,
        learning_objectives JSONB,
        teaching_notes TEXT,
        estimated_duration_mins INTEGER,
        content JSONB,
        prerequisite_topics VARCHAR(255)[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table ready');

    // Insert topics
    const topics = [
      {
        topic_id: 'maths_y7_algebra',
        topic_name: 'Algebra Basics',
        subject: 'maths',
        year_level: 7,
        exam_board: 'GCSE',
        description: 'Introduction to algebraic expressions and equations',
        learning_objectives: ['Simplify algebraic expressions', 'Solve linear equations', 'Substitute values into formulas'],
        estimated_duration_mins: 15,
      },
      {
        topic_id: 'maths_y7_fractions',
        topic_name: 'Fractions',
        subject: 'maths',
        year_level: 7,
        exam_board: 'GCSE',
        description: 'Working with fractions, decimals, and percentages',
        learning_objectives: ['Add and subtract fractions', 'Multiply and divide fractions', 'Convert between fractions, decimals, and percentages'],
        estimated_duration_mins: 20,
      },
      {
        topic_id: 'maths_y8_angles',
        topic_name: 'Angles and Geometry',
        subject: 'maths',
        year_level: 8,
        exam_board: 'GCSE',
        description: 'Understanding angles, shapes, and geometric properties',
        learning_objectives: ['Measure and draw angles', 'Calculate angles in triangles', 'Understand angle properties'],
        estimated_duration_mins: 18,
      },
      {
        topic_id: 'science_y7_cells',
        topic_name: 'Cells and Organisation',
        subject: 'science',
        year_level: 7,
        exam_board: 'GCSE',
        description: 'Introduction to cells, tissues, and organs',
        learning_objectives: ['Identify plant and animal cells', 'Understand cell structure', 'Describe levels of organisation'],
        estimated_duration_mins: 16,
      },
    ];

    console.log('📝 Inserting topics...');
    for (const topic of topics) {
      await client.query(
        `INSERT INTO curriculum_topics (topic_id, topic_name, subject, year_level, exam_board, description, learning_objectives, estimated_duration_mins)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (topic_id) DO UPDATE SET
           topic_name = EXCLUDED.topic_name,
           subject = EXCLUDED.subject,
           year_level = EXCLUDED.year_level,
           description = EXCLUDED.description,
           learning_objectives = EXCLUDED.learning_objectives,
           updated_at = CURRENT_TIMESTAMP`,
        [
          topic.topic_id,
          topic.topic_name,
          topic.subject,
          topic.year_level,
          topic.exam_board,
          topic.description,
          JSON.stringify(topic.learning_objectives),
          topic.estimated_duration_mins,
        ]
      );
      console.log(`✅ ${topic.topic_name} (Year ${topic.year_level} ${topic.subject})`);
    }

    // Count and display
    const countResult = await client.query('SELECT COUNT(*) FROM curriculum_topics');
    console.log(`\n📊 Total topics: ${countResult.rows[0].count}`);

    const allTopics = await client.query('SELECT topic_id, topic_name, subject, year_level FROM curriculum_topics ORDER BY subject, year_level');
    console.log('\n📚 Available topics:');
    allTopics.rows.forEach((t: any) => {
      console.log(`   - ${t.topic_name} (${t.subject}, Year ${t.year_level})`);
    });

    console.log('\n✅ Seed completed successfully!');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

seedRaw();
