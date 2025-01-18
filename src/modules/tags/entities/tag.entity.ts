// src/modules/tags/entities/tag.entity.ts

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

import { TagRelation } from './tag-relation.entity';
import { User } from '../../users/entities/user.entity';

@Entity('tags')
export class Tag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50 })
  name: string;

  @Column({ length: 50, unique: true })
  slug: string;

  @Column({ length: 255, nullable: true })
  description: string;

  @Column({ length: 7, default: '#6B7280' })
  color: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'parent_id', nullable: true })
  parentId: string;

  @ManyToOne(() => Tag, (tag) => tag.children)
  @JoinColumn({ name: 'parent_id' })
  parent: Tag;

  @OneToMany(() => Tag, (tag) => tag.parent)
  children: Tag[];

  @OneToMany(() => TagRelation, (relation) => relation.sourceTag)
  sourceRelations: TagRelation[];

  @OneToMany(() => TagRelation, (relation) => relation.relatedTag)
  relatedRelations: TagRelation[];

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
  generateSlug() {
    if (this.name) {
      this.slug = this.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
    }
  }
}
