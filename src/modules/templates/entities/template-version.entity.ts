// src/modules/templates/entities/template-version.entity.ts

import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Template } from './template.entity';
import { User } from '../../users/entities/user.entity';

@Entity('template_versions')
export class TemplateVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'template_id' })
  templateId: string;

  @ManyToOne(() => Template, (template) => template.versions)
  @JoinColumn({ name: 'template_id' })
  template: Template;

  @Column()
  version: number;

  @Column({ type: 'json' })
  metadataSchema: Record<string, any>;

  @Column({ type: 'json' })
  fieldsSchema: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  validationRules: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  requiredFields: string[];

  @Column({ type: 'json', nullable: true })
  defaultValues: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  changeNotes: string;

  @Column({ name: 'created_by', nullable: true })
  createdById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
