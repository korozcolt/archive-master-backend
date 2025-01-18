import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';

// src/modules/workflow/dto/workflow-step/create-workflow-step.dto.ts
export class CreateWorkflowStepDto {
  @ApiProperty({ example: 'Initial Review' })
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty()
  @IsUUID()
  statusId: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  assigneeRoleId?: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  config?: Record<string, any>;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
