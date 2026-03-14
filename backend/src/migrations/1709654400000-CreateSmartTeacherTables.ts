import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateSmartTeacherTables1709654400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Topic Mastery Table
    await queryRunner.createTable(
      new Table({
        name: 'topic_mastery',
        columns: [
          {
            name: 'student_id',
            type: 'varchar',
            length: '255',
            isPrimary: true,
          },
          {
            name: 'topic_id',
            type: 'varchar',
            length: '255',
            isPrimary: true,
          },
          {
            name: 'mastery_percent',
            type: 'int',
            default: 0,
          },
          {
            name: 'attempts_count',
            type: 'int',
            default: 0,
          },
          {
            name: 'error_tags',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'last_practiced',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'confidence_signal',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'developing'",
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Teaching Sessions Table
    await queryRunner.createTable(
      new Table({
        name: 'teaching_sessions',
        columns: [
          {
            name: 'session_id',
            type: 'varchar',
            length: '255',
            isPrimary: true,
          },
          {
            name: 'student_id',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'topic_id',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'tutor_type',
            type: 'varchar',
            length: '50', // 'maths', 'science', 'homework'
          },
          {
            name: 'current_step',
            type: 'int',
            default: 1, // 1-7 teaching flow
          },
          {
            name: 'diagnostic_score',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'mastery_check_passed',
            type: 'boolean',
            isNullable: true,
          },
          {
            name: 'attempts',
            type: 'int',
            default: 0,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'completed_at',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Safeguarding Logs Table
    await queryRunner.createTable(
      new Table({
        name: 'safeguarding_logs',
        columns: [
          {
            name: 'log_id',
            type: 'varchar',
            length: '255',
            isPrimary: true,
          },
          {
            name: 'student_id',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'session_id',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'flag_type',
            type: 'varchar',
            length: '50', // 'emotional_distress', 'self_harm', 'cheating_attempt'
          },
          {
            name: 'message_content',
            type: 'text',
          },
          {
            name: 'response_given',
            type: 'text',
          },
          {
            name: 'escalated',
            type: 'boolean',
            default: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Error Logs Table
    await queryRunner.createTable(
      new Table({
        name: 'error_logs',
        columns: [
          {
            name: 'error_id',
            type: 'varchar',
            length: '255',
            isPrimary: true,
          },
          {
            name: 'student_id',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'topic_id',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'error_type',
            type: 'varchar',
            length: '50', // 'arithmetic', 'method', 'misconception'
          },
          {
            name: 'question_content',
            type: 'text',
          },
          {
            name: 'student_answer',
            type: 'text',
          },
          {
            name: 'correct_answer',
            type: 'text',
          },
          {
            name: 'feedback_given',
            type: 'text',
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create foreign keys
    await queryRunner.createForeignKey(
      'teaching_sessions',
      new TableForeignKey({
        columnNames: ['student_id'],
        referencedTableName: 'student_profiles',
        referencedColumnNames: ['student_id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'topic_mastery',
      new TableForeignKey({
        columnNames: ['student_id'],
        referencedTableName: 'student_profiles',
        referencedColumnNames: ['student_id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'safeguarding_logs',
      new TableForeignKey({
        columnNames: ['student_id'],
        referencedTableName: 'student_profiles',
        referencedColumnNames: ['student_id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'error_logs',
      new TableForeignKey({
        columnNames: ['student_id'],
        referencedTableName: 'student_profiles',
        referencedColumnNames: ['student_id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('error_logs');
    await queryRunner.dropTable('safeguarding_logs');
    await queryRunner.dropTable('teaching_sessions');
    await queryRunner.dropTable('topic_mastery');
  }
}
