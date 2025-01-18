// src/modules/workflow/entities/workflow-definition.entity.ts

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

import { User } from '../../users/entities/user.entity';
import { WorkflowInstance } from './workflow-instance.entity';
import { WorkflowStep } from './workflow-step.entity';
import { WorkflowTransition } from './workflow-transition.entity';

@Entity('workflow_definitions')
export class WorkflowDefinition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 50, unique: true })
  code: string;

  @Column({ length: 255, nullable: true })
  description: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => WorkflowStep, (step) => step.workflowDefinition, {
    cascade: true,
  })
  steps: WorkflowStep[];

  @OneToMany(() => WorkflowTransition, (transition) => transition.workflowDefinition, {
    cascade: true,
  })
  transitions: WorkflowTransition[];

  @OneToMany(() => WorkflowInstance, (instance) => instance.workflowDefinition)
  instances: WorkflowInstance[];

  @Column({ name: 'created_by', nullable: true })
  createdById: string;

  @Column({ name: 'updated_by', nullable: true })
  updatedById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'updated_by' })
  updatedBy: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
