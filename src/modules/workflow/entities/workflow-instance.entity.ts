// src/modules/workflow/entities/workflow-instance.entity.ts

import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Document } from '../../documents/entities/document.entity';
import { User } from '../../users/entities/user.entity';
import { WorkflowDefinition } from './workflow-definition.entity';
import { WorkflowStep } from './workflow-step.entity';
import { WorkflowTask } from './workflow-task.entity';

@Entity('workflow_instances')
export class WorkflowInstance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'workflow_definition_id' })
  workflowDefinitionId: string;

  @ManyToOne(() => WorkflowDefinition)
  @JoinColumn({ name: 'workflow_definition_id' })
  workflowDefinition: WorkflowDefinition;

  @Column({ name: 'document_id' })
  documentId: string;

  @ManyToOne(() => Document)
  @JoinColumn({ name: 'document_id' })
  document: Document;

  @Column({ name: 'current_step_id' })
  currentStepId: string;

  @ManyToOne(() => WorkflowStep)
  @JoinColumn({ name: 'current_step_id' })
  currentStep: WorkflowStep;

  @Column({
    name: 'status',
    type: 'enum',
    enum: ['active', 'completed', 'cancelled'],
    default: 'active',
  })
  status: 'active' | 'completed' | 'cancelled';

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @OneToMany(() => WorkflowTask, (task) => task.workflowInstance)
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

  @OneToOne(() => WorkflowTask)
  @JoinColumn({ name: 'current_task_id' })
  currentTask: WorkflowTask;

  @Column({ name: 'current_task_id', nullable: true })
  currentTaskId: string;
}
