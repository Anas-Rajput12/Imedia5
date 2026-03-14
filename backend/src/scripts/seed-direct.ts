/**
 * Direct Database Seed Script
 * Inserts curriculum topics directly
 */

import 'reflect-metadata';
import { AppDataSource } from '../config/database';

async function seedDirect() {
  try {
    console.log('🌱 Starting direct seed...');

    await AppDataSource.initialize();
    console.log('✅ Database connected');

    const queryRunner = AppDataSource.createQueryRunner();

    // Insert topics directly using SQL
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

    for (const topic of topics) {
      try {
        await queryRunner.query(
          `INSERT INTO curriculum_topics (topic_id, topic_name, subject, year_level, exam_board, description, learning_objectives, estimated_duration_mins, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
           ON CONFLICT (topic_id) DO UPDATE SET
             topic_name = EXCLUDED.topic_name,
             subject = EXCLUDED.subject,
             year_level = EXCLUDED.year_level,
             description = EXCLUDED.description,
             learning_objectives = EXCLUDED.learning_objectives,
             updated_at = NOW()`,
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
        console.log(`✅ Topic: ${topic.topic_name} (Year ${topic.year_level} ${topic.subject})`);
      } catch (err: any) {
        console.log(`⚠️  ${topic.topic_name}: ${err.message}`);
      }
    }

    // Count and display topics
    const result = await queryRunner.query('SELECT COUNT(*) FROM curriculum_topics');
    console.log(`\n📊 Total topics in database: ${result[0].count}`);

    // List all topics
    const allTopics = await queryRunner.query('SELECT topic_id, topic_name, subject, year_level FROM curriculum_topics ORDER BY subject, year_level');
    console.log('\n📚 Available topics:');
    allTopics.forEach((t: any) => {
      console.log(`   - ${t.topic_name} (${t.subject}, Year ${t.year_level})`);
    });

    await AppDataSource.destroy();
    console.log('\n✅ Seed completed successfully!');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  }
}

seedDirect();
