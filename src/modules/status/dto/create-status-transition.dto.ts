// src/modules/status/dto/create-status-transition.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateStatusTransitionDto {
  @ApiPropertyOptional({ example: 'uuid' })
  @IsUUID()
  @IsOptional()
  fromStatusId?: string;

  @ApiProperty({ example: 'uuid' })
  @IsUUID()
  toStatusId: string;

  @ApiProperty({ example: 'Submit for Review' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Submit document for review' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  requiresComment?: boolean;

  @ApiPropertyOptional({ example: 'uuid' })
  @IsUUID()
  @IsOptional()
  requiredRoleId?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
