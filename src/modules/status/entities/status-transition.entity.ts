// src/modules/status/entities/

import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Role } from '../../roles/entities/role.entity';
import { Status } from './status.entity';
import { User } from '../../users/entities/user.entity';

@Entity('status_transitions')
export class StatusTransition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'from_status_id', nullable: true })
  fromStatusId: string;

  @Column({ name: 'to_status_id' })
  toStatusId: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 255, nullable: true })
  description: string;

  @Column({ name: 'requires_comment', default: false })
  requiresComment: boolean;

  @Column({ name: 'required_role_id', nullable: true })
  requiredRoleId: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ManyToOne(() => Status, (status) => status.transitionsFrom, { nullable: true })
  @JoinColumn({ name: 'from_status_id' })
  fromStatus: Status;

  @ManyToOne(() => Status, (status) => status.transitionsTo)
  @JoinColumn({ name: 'to_status_id' })
  toStatus: Status;

  @ManyToOne(() => Role, { nullable: true })
  @JoinColumn({ name: 'required_role_id' })
  requiredRole: Role;

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

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
