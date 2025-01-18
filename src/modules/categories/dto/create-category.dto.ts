// src/modules/categories/dto/create-category.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Financial Documents' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Description of the category' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'uuid-of-parent-category' })
  @IsUUID()
  @IsOptional()
  parentId?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: { required: ['documentType'], properties: { documentType: { type: 'string' } } },
  })
  @IsObject()
  @IsOptional()
  metadataSchema?: Record<string, any>;

  @ApiPropertyOptional({ default: 0 })
  @IsInt()
  @IsOptional()
  order?: number;
}
