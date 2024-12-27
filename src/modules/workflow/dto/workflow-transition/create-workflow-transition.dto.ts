// src/modules/workflow/dto/workflow-transition/create-workflow-transition.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateWorkflowTransitionDto {
  @ApiProperty({ example: 'Submit for Review' })
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  fromStepId?: string;

  @ApiProperty()
  @IsUUID()
  toStepId: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  requiredRoleId?: string;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  requiresComment?: boolean;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  conditions?: Record<string, any>;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
