// src/modules/tags/dto/tag-tree.dto.ts

import { TagResponseDto } from './tag-response.dto';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

export class TagTreeDto extends TagResponseDto {
  @ValidateNested({ each: true })
  @Type(() => TagTreeDto)
  children: TagTreeDto[];
}
