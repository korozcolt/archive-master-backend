// src/modules/companies/entities/department.entity.ts

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

import { Branch } from './branch.entity';
import { User } from '@/modules/users/entities/user.entity';

@Entity('departments')
export class Department {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'branch_id' })
  branchId: string;

  @ManyToOne(() => Branch, (branch) => branch.departments)
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({ name: 'parent_id', nullable: true })
  parentId: string;

  @ManyToOne(() => Department, (department) => department.children)
  @JoinColumn({ name: 'parent_id' })
  parent: Department;

  @OneToMany(() => Department, (department) => department.parent)
  children: Department[];

  @Column({ length: 100 })
  name: string;

  @Column({ length: 20, unique: true })
  code: string;

  @Column({ length: 255, nullable: true })
  description: string;

  @Column({ name: 'manager_id', nullable: true })
  managerId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'manager_id' })
  manager: User;

  @OneToMany(() => User, (user) => user.department)
  users: User[];

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

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
