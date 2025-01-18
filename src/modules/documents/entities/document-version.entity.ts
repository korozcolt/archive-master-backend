import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Document } from './document.entity';
import { User } from '../../users/entities/user.entity';

@Entity('document_versions')
export class DocumentVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  versionNumber: number;

  @Column('text')
  content: string;

  @Column('json', { nullable: true }) // Cambiado de 'jsonb' a 'json'
  changes: Record<string, any>;

  @ManyToOne(() => Document, (document) => document.versions)
  @JoinColumn({ name: 'document_id' })
  document: Document;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by_id' })
  createdBy: User;

  @CreateDateColumn()
  createdAt: Date;
}
