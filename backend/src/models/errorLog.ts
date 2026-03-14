import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { StudentProfile } from './studentProfile';

@Entity('error_logs')
export class ErrorLog {
  @PrimaryColumn({ length: 255 })
  error_id!: string;

  @Column({ length: 255 })
  student_id!: string;

  @Column({ length: 255 })
  topic_id!: string;

  @Column({ length: 50 })
  error_type!: 'arithmetic' | 'method' | 'misconception';

  @Column({ type: 'text' })
  question_content!: string;

  @Column({ type: 'text' })
  student_answer!: string;

  @Column({ type: 'text' })
  correct_answer!: string;

  @Column({ type: 'text' })
  feedback_given!: string;

  @CreateDateColumn()
  created_at!: Date;

  @ManyToOne(() => StudentProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student!: StudentProfile;
}
