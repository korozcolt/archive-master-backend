// src/modules/status/entities/status.entity.ts

import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { StatusTransition } from './status-transition.entity';
import { User } from '../../users/entities/user.entity';

@Entity('status')
export class Status {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50 })
  name: string;

  @Column({ length: 50, unique: true })
  code: string;

  @Column({ length: 255, nullable: true })
  description: string;

  @Column({ length: 7, default: '#6B7280' })
  color: string;

  @Column({ length: 50, nullable: true })
  icon: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'created_by', nullable: true })
  createdById: string;

  @Column({ name: 'updated_by', nullable: true })
  updatedById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updatedBy: User;

  @OneToMany(() => StatusTransition, (transition) => transition.fromStatus)
  transitionsFrom: StatusTransition[];

  @OneToMany(() => StatusTransition, (transition) => transition.toStatus)
  transitionsTo: StatusTransition[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
