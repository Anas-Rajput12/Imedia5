/**
 * LearningSession Entity
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ForeignKey,
  JoinColumn,
} from 'typeorm';
import { StudentProfile } from './studentProfile';

@Entity('learning_sessions')
export class LearningSession {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: false })
  session_id!: string;

  @Column({ nullable: false })
  @ForeignKey(() => StudentProfile)
  @JoinColumn({ name: 'student_id' })
  student_id!: string;

  @Column({ nullable: false })
  topic_id!: string;

  @Column({ nullable: false })
  tutor_type!: string; // 'maths', 'science', 'homework'

  @Column({ type: 'simple-json', nullable: true })
  session_data!: Record<string, any> | null;

  @Column({ default: 0 })
  accuracy!: number;

  @Column({ default: 0 })
  total_questions!: number;

  @Column({ default: 0 })
  correct_answers!: number;

  @Column({ default: 'active' })
  status!: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', nullable: true })
  updated_at!: Date | null;

  @ManyToOne(() => StudentProfile, (student) => student.learning_sessions)
  @JoinColumn({ name: 'student_id' })
  student!: StudentProfile;

  toJSON(): any {
    return {
      id: this.id,
      session_id: this.session_id,
      student_id: this.student_id,
      topic_id: this.topic_id,
      tutor_type: this.tutor_type,
      session_data: this.session_data,
      accuracy: this.accuracy,
      total_questions: this.total_questions,
      correct_answers: this.correct_answers,
      status: this.status,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}
