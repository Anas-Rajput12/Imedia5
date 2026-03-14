/**
 * ChatSession and ChatMessage Entities
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
  OneToMany,
  Index,
} from 'typeorm';
import { StudentProfile } from './studentProfile';

@Entity('chat_sessions')
@Index(['session_id'])
export class ChatSession {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: false })
  session_id!: string;

  @Column({ nullable: false })
  @ForeignKey(() => StudentProfile)
  @JoinColumn({ name: 'student_id' })
  student_id!: string;

  @Column({ type: 'varchar', nullable: true })
  topic_id!: string | null;

  @Column({ default: 'rag_chatbot' })
  chat_type!: string; // 'rag_chatbot', 'tutor_chat', etc.

  @Column({ default: 0 })
  message_count!: number;

  @Column({ default: 'active' })
  status!: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', nullable: true })
  updated_at!: Date | null;

  @ManyToOne(() => StudentProfile, (student) => student.chat_sessions)
  @JoinColumn({ name: 'student_id' })
  student!: StudentProfile;

  @OneToMany(() => ChatMessage, (message) => message.session)
  messages!: ChatMessage[];

  toJSON(): any {
    return {
      id: this.id,
      session_id: this.session_id,
      student_id: this.student_id,
      topic_id: this.topic_id,
      chat_type: this.chat_type,
      message_count: this.message_count,
      status: this.status,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}

@Entity('chat_messages')
@Index(['session_id'])
export class ChatMessage {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: false })
  @ForeignKey(() => ChatSession)
  @JoinColumn({ name: 'session_id' })
  session_id!: string;

  @Column({ nullable: false })
  message_id!: string;

  @Column({ nullable: false })
  role!: string; // 'user', 'assistant', 'system'

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'simple-json', nullable: true })
  metadata!: Record<string, any> | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at!: Date;

  @ManyToOne(() => ChatSession, (session) => session.messages)
  @JoinColumn({ name: 'session_id' })
  session!: ChatSession;

  toJSON(): any {
    return {
      id: this.id,
      session_id: this.session_id,
      message_id: this.message_id,
      role: this.role,
      content: this.content,
      metadata: this.metadata,
      created_at: this.created_at,
    };
  }
}
