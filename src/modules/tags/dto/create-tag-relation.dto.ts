// src/modules/tags/dto/create-tag-relation.dto.ts

import { IsEnum, IsUUID } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';
import { RelationType } from '../entities/tag-relation.entity';

export class CreateTagRelationDto {
  @ApiProperty({ example: 'source-tag-uuid' })
  @IsUUID()
  sourceTagId: string;

  @ApiProperty({ example: 'related-tag-uuid' })
  @IsUUID()
  relatedTagId: string;

  @ApiProperty({ enum: RelationType, example: RelationType.RELATED })
  @IsEnum(RelationType)
  relationType: RelationType;
}
