/**
 * CurriculumTopic Entity
 */

import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { TopicMastery } from './topicMastery';

@Entity('curriculum_topics')
export class CurriculumTopic {
  @PrimaryColumn({ type: 'varchar' })
  topic_id!: string;

  @Column({ type: 'varchar', nullable: false })
  topic_name!: string;

  @Column({ type: 'varchar', nullable: false })
  subject!: string;

  @Column({ type: 'int', nullable: false })
  year_level!: number;

  @Column({ type: 'varchar', nullable: true })
  exam_board!: string | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'simple-json', nullable: true })
  learning_objectives!: string[] | null;

  @Column({ type: 'simple-json', nullable: true })
  prerequisite_topics!: string[] | null;

  // ✅ FIXED LINE
  @Column({ type: 'int', nullable: true })
  estimated_duration_mins!: number | null;

  @Column({ type: 'simple-json', nullable: true })
  content!: Record<string, any> | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', nullable: true })
  updated_at!: Date | null;

  // Relationship removed - TopicMastery doesn't have inverse side
  // @OneToMany(() => TopicMastery, (mastery) => mastery.topic)
  // mastery_records!: TopicMastery[];

  toJSON(): any {
    return {
      topic_id: this.topic_id,
      topic_name: this.topic_name,
      subject: this.subject,
      year_level: this.year_level,
      exam_board: this.exam_board,
      description: this.description,
      learning_objectives: this.learning_objectives,
      prerequisite_topics: this.prerequisite_topics,
      estimated_duration_mins: this.estimated_duration_mins,
      content: this.content,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}