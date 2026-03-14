import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { StudentProfile } from './studentProfile';

@Entity('safeguarding_logs')
export class SafeguardingLog {
  @PrimaryColumn({ length: 255 })
  log_id!: string;

  @Column({ length: 255 })
  student_id!: string;

  @Column({ length: 255 })
  session_id!: string;

  @Column({ length: 50 })
  flag_type!: 'emotional_distress' | 'self_harm' | 'cheating_attempt';

  @Column({ type: 'text' })
  message_content!: string;

  @Column({ type: 'text' })
  response_given!: string;

  @Column({ type: 'boolean', default: false })
  escalated!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @ManyToOne(() => StudentProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student!: StudentProfile;
}
