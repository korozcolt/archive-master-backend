import { RelationType } from '../entities/tag-relation.entity';
import { TagResponseDto } from './tag-response.dto';

// src/modules/tags/dto/tag-relation-response.dto.ts
export class TagRelationResponseDto {
  id: string;
  sourceTagId: string;
  relatedTagId: string;
  relationType: RelationType;
  createdById?: string;
  createdAt: Date;
  sourceTag?: TagResponseDto;
  relatedTag?: TagResponseDto;
}
