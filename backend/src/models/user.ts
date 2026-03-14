/**
 * User Entity
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { StudentProfile } from './studentProfile';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, nullable: false })
  @Index()
  email!: string;

  @Column({ nullable: false })
  password!: string;

  @Column({ nullable: false })
  first_name!: string;

  @Column({ nullable: false })
  last_name!: string;

  @Column({ default: 5 })
  year_group!: number;

  @Column({ default: true })
  is_active!: boolean;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', nullable: true })
  updated_at!: Date | null;

  @OneToMany(() => StudentProfile, (profile) => profile.user)
  profiles!: StudentProfile[];

  toJSON(): any {
    const { password, ...result } = this;
    return result;
  }
}
