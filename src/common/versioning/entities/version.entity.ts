import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from '@/modules/users/entities/user.entity';
import { VersionOperation } from '../enums/version-operation.enum';

@Entity('versions')
export class Version {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  entityId: string;

  @Column()
  entityType: string;

  @Column()
  versionNumber: number;

  // Cambiar de 'jsonb' a 'text' y usar JSON.stringify/parse
  @Column('text', {
    transformer: {
      to: (value: any) => JSON.stringify(value),
      from: (value: string) => JSON.parse(value),
    },
  })
  content: Record<string, any>;

  // Mismo cambio para changes
  @Column('text', {
    nullable: true,
    transformer: {
      to: (value: any) => (value ? JSON.stringify(value) : null),
      from: (value: string) => (value ? JSON.parse(value) : null),
    },
  })
  changes: Record<string, any>;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by_id' })
  createdBy: User;

  @Column({
    type: 'enum',
    enum: VersionOperation,
  })
  operation: VersionOperation;

  @CreateDateColumn()
  createdAt: Date;
}
