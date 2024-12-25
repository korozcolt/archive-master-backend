// src/modules/templates/entities/template.entity.ts

import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Category } from '../../categories/entities/category.entity';
import { Status } from '../../status/entities/status.entity';
import { TemplateVersion } from './template-version.entity';
import { User } from '../../users/entities/user.entity';

@Entity('templates')
export class Template {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 50, unique: true })
  code: string;

  @Column({ length: 255, nullable: true })
  description: string;

  @Column({ name: 'category_id', nullable: true })
  categoryId: string;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ name: 'initial_status_id', nullable: true })
  initialStatusId: string;

  @ManyToOne(() => Status)
  @JoinColumn({ name: 'initial_status_id' })
  initialStatus: Status;

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

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ default: 1 })
  version: number;

  @OneToMany(() => TemplateVersion, (version) => version.template)
  versions: TemplateVersion[];

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

  @BeforeInsert()
  @BeforeUpdate()
  generateCode() {
    if (this.name && !this.code) {
      this.code = this.name
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '_')
        .replace(/(^_|_$)+/g, '');
    }
  }
}
