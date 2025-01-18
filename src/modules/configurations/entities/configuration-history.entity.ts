import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Configuration } from './configuration.entity';
import { User } from '../../users/entities/user.entity';

@Entity('configuration_history')
export class ConfigurationHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'configuration_id' })
  configurationId: string;

  @ManyToOne(() => Configuration, (config) => config.history)
  @JoinColumn({ name: 'configuration_id' })
  configuration: Configuration;

  @Column({ name: 'old_value', type: 'text', nullable: true })
  oldValue: string;

  @Column({ name: 'new_value', type: 'text' })
  newValue: string;

  @Column({ name: 'change_notes', length: 255, nullable: true })
  changeNotes: string;

  @Column({ name: 'created_by', nullable: true })
  createdById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
