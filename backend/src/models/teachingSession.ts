import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { StudentProfile } from './studentProfile';

@Entity('teaching_sessions')
export class TeachingSession {
  @PrimaryColumn({ length: 255 })
  session_id!: string;

  @Column({ length: 255 })
  student_id!: string;

  @Column({ length: 255 })
  topic_id!: string;

  @Column({ length: 50 })
  tutor_type!: 'maths' | 'science' | 'homework';

  @Column({ type: 'int', default: 1 })
  current_step!: number; // 1-7 teaching flow

  @Column({ type: 'int', nullable: true })
  diagnostic_score!: number | null;

  @Column({ type: 'boolean', nullable: true })
  mastery_check_passed!: boolean | null;

  @Column({ type: 'int', default: 0 })
  attempts!: number;

  @CreateDateColumn()
  created_at!: Date;

  @Column({ type: 'timestamp', nullable: true })
  completed_at!: Date | null;

  @ManyToOne(() => StudentProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student!: StudentProfile;

  /**
   * Teaching flow steps
   */
  static readonly STEPS = {
    CONFIRM: 1,       // Confirm year group + topic
    DIAGNOSTIC: 2,    // Diagnostic micro-check (1-3 questions)
    TEACH: 3,         // Teach in small chunk
    EXAMPLE: 4,       // Guided example
    ATTEMPT: 5,       // Student attempt
    FEEDBACK: 6,      // Feedback
    MASTERY: 7,       // Mastery check
  };

  /**
   * Move to next step
   */
  nextStep(): void {
    if (this.current_step < 7) {
      this.current_step += 1;
    }
  }

  /**
   * Check if session is complete
   */
  isComplete(): boolean {
    return this.current_step === 7 && this.mastery_check_passed === true;
  }

  /**
   * Complete session
   */
  complete(masteryPassed: boolean): void {
    this.mastery_check_passed = masteryPassed;
    this.completed_at = new Date();
  }
}
