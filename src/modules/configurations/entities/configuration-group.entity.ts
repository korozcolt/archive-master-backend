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

import { Configuration } from './configuration.entity';
import { User } from '../../users/entities/user.entity';

@Entity('configuration_groups')
export class ConfigurationGroup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 50, unique: true })
  code: string;

  @Column({ length: 255, nullable: true })
  description: string;

  @Column({ length: 50, nullable: true })
  icon: string;

  @Column({ default: 0 })
  order: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => Configuration, (config) => config.group)
  configurations: Configuration[];

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
