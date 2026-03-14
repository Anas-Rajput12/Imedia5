/**
 * StudentProfile Entity
 */

import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  ForeignKey,
  JoinColumn,
} from 'typeorm';
import { User } from './user';
import { LearningSession } from './learningSession';
import { TeachingSession } from './teachingSession';
import { ChatSession } from './chatSession';
import { TopicMastery } from './topicMastery';

@Entity('student_profiles')
export class StudentProfile {
  @PrimaryColumn()
  student_id!: string;

  @Column({ type: 'varchar', nullable: true })
  clerk_user_id!: string | null;

  @Column({ nullable: true })
  user_id!: number | null;

  @Column({ type: 'varchar', nullable: true })
  first_name!: string;

  @Column({ type: 'varchar', nullable: true })
  last_name!: string;

  @Column({ type: 'varchar', nullable: true })
  email!: string | null;

  @Column({ default: 5 })
  year_group!: number;

  @Column({ default: 'maths' })
  preferred_subject!: string;

  @Column({ type: 'simple-json', nullable: true })
  learning_preferences!: Record<string, any> | null;

  @Column({ type: 'simple-json', nullable: true })
  weak_topics!: string[] | null;

  @Column({ default: true })
  is_active!: boolean;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', nullable: true })
  updated_at!: Date | null;

  @ManyToOne(() => User, (user) => user.profiles, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user!: User | null;

  @OneToMany(() => LearningSession, (session) => session.student)
  learning_sessions!: LearningSession[];

  @OneToMany(() => TeachingSession, (session) => session.student)
  teaching_sessions!: TeachingSession[];

  @OneToMany(() => ChatSession, (session) => session.student)
  chat_sessions!: ChatSession[];

  @OneToMany(() => TopicMastery, (mastery) => mastery.student)
  topic_mastery!: TopicMastery[];

  toJSON(): any {
    return {
      student_id: this.student_id,
      clerk_user_id: this.clerk_user_id,
      user_id: this.user_id,
      first_name: this.first_name,
      last_name: this.last_name,
      email: this.email,
      year_group: this.year_group,
      preferred_subject: this.preferred_subject,
      learning_preferences: this.learning_preferences,
      weak_topics: this.weak_topics,
      is_active: this.is_active,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}
