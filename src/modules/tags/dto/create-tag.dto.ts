// src/modules/tags/dto/create-tag.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsHexColor, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateTagDto {
  @ApiProperty({ example: 'Important' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Description of the tag' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: '#FF5733' })
  @IsHexColor()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 'parent-tag-uuid' })
  @IsUUID()
  @IsOptional()
  parentId?: string;
}
