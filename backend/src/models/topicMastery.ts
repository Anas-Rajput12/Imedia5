import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { StudentProfile } from './studentProfile';

@Entity('topic_mastery')
export class TopicMastery {
  @PrimaryColumn({ length: 255 })
  student_id!: string;

  @PrimaryColumn({ length: 255 })
  topic_id!: string;

  @Column({ type: 'int', default: 0 })
  mastery_percent!: number;

  @Column({ type: 'int', default: 0 })
  attempts_count!: number;

  @Column({ type: 'json', nullable: true })
  error_tags!: string[] | null;

  @Column({ type: 'timestamp', nullable: true })
  last_practiced!: Date | null;

  @Column({ type: 'int', nullable: true })
  confidence_signal!: number | null;

  @Column({ type: 'varchar', length: 50, default: 'developing' })
  status!: 'secure' | 'developing' | 'at_risk';

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @ManyToOne(() => StudentProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student!: StudentProfile;

  /**
   * Update mastery status based on percentage
   */
  updateStatus(): void {
    if (this.mastery_percent >= 80) {
      this.status = 'secure';
    } else if (this.mastery_percent >= 50) {
      this.status = 'developing';
    } else {
      this.status = 'at_risk';
    }
  }

  /**
   * Add error tag
   */
  addErrorTag(tag: string): void {
    if (!this.error_tags) {
      this.error_tags = [];
    }
    if (!this.error_tags.includes(tag)) {
      this.error_tags.push(tag);
    }
  }

  /**
   * Increment attempts
   */
  incrementAttempts(): void {
    this.attempts_count += 1;
    this.last_practiced = new Date();
  }
}
