// src/modules/workflow/entities/workflow-step.entity.ts

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

import { Role } from '../../roles/entities/role.entity';
import { Status } from '../../status/entities/status.entity';
import { User } from '../../users/entities/user.entity';
import { WorkflowDefinition } from './workflow-definition.entity';
import { WorkflowTask } from './workflow-task.entity';

@Entity('workflow_steps')
export class WorkflowStep {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'workflow_definition_id' })
  workflowDefinitionId: string;

  @ManyToOne(() => WorkflowDefinition, (definition) => definition.steps)
  @JoinColumn({ name: 'workflow_definition_id' })
  workflowDefinition: WorkflowDefinition;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 255, nullable: true })
  description: string;

  @Column({ name: 'status_id' })
  statusId: string;

  @ManyToOne(() => Status)
  @JoinColumn({ name: 'status_id' })
  status: Status;

  @Column({ name: 'assignee_role_id', nullable: true })
  assigneeRoleId: string;

  @ManyToOne(() => Role, { nullable: true })
  @JoinColumn({ name: 'assignee_role_id' })
  assigneeRole: Role;

  @Column({ type: 'json', nullable: true })
  config: Record<string, any>;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => WorkflowTask, (task) => task.step)
  tasks: WorkflowTask[];

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
