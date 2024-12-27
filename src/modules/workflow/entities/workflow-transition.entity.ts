// src/modules/workflow/entities/workflow-transition.entity.ts

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
import { User } from '../../users/entities/user.entity';
import { WorkflowDefinition } from './workflow-definition.entity';
import { WorkflowStep } from './workflow-step.entity';

@Entity('workflow_transitions')
export class WorkflowTransition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'workflow_definition_id' })
  workflowDefinitionId: string;

  @ManyToOne(() => WorkflowDefinition, (definition) => definition.transitions)
  @JoinColumn({ name: 'workflow_definition_id' })
  workflowDefinition: WorkflowDefinition;

  @Column({ name: 'from_step_id', nullable: true })
  fromStepId: string;

  @ManyToOne(() => WorkflowStep, { nullable: true })
  @JoinColumn({ name: 'from_step_id' })
  fromStep: WorkflowStep;

  @Column({ name: 'to_step_id' })
  toStepId: string;

  @ManyToOne(() => WorkflowStep)
  @JoinColumn({ name: 'to_step_id' })
  toStep: WorkflowStep;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 255, nullable: true })
  description: string;

  @Column({ name: 'required_role_id', nullable: true })
  requiredRoleId: string;

  @ManyToOne(() => Role, { nullable: true })
  @JoinColumn({ name: 'required_role_id' })
  requiredRole: Role;

  @Column({ name: 'requires_comment', default: false })
  requiresComment: boolean;

  @Column({ type: 'json', nullable: true })
  conditions: Record<string, any>;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

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
