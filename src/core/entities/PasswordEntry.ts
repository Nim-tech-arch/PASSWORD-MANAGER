/**
 * PasswordEntry Entity for PostgreSQL
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './User';

@Entity('password_entries')
@Index(['userId', 'service'])
@Index(['userId'])
export class PasswordEntry {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, (user) => user.passwords, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column({ type: 'varchar', length: 255 })
  service!: string;

  @Column({ type: 'varchar', length: 255 })
  username!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string;

  @Column({ type: 'text' }) // Encrypted password
  encryptedPassword!: string;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  url?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'simple-array', nullable: true })
  tags?: string[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastUsed?: Date;
}
