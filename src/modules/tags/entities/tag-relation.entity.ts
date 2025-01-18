// src/modules/tags/entities/tag-relation.entity.ts

import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Tag } from './tag.entity';
import { User } from '../../users/entities/user.entity';

export enum RelationType {
  PARENT = 'parent',
  RELATED = 'related',
  SYNONYM = 'synonym',
}

@Entity('tag_relations')
export class TagRelation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'source_tag_id' })
  sourceTagId: string;

  @Column({ name: 'related_tag_id' })
  relatedTagId: string;

  @Column({
    name: 'relation_type',
    type: 'enum',
    enum: RelationType,
  })
  relationType: RelationType;

  @ManyToOne(() => Tag, (tag) => tag.sourceRelations)
  @JoinColumn({ name: 'source_tag_id' })
  sourceTag: Tag;

  @ManyToOne(() => Tag, (tag) => tag.relatedRelations)
  @JoinColumn({ name: 'related_tag_id' })
  relatedTag: Tag;

  @Column({ name: 'created_by', nullable: true })
  createdById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
