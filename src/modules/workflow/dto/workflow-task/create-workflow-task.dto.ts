// src/modules/workflow/dto/workflow-task/create-workflow-task.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDate, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';

import { Type } from 'class-transformer';

export class CreateWorkflowTaskDto {
  @ApiProperty()
  @IsUUID()
  workflowInstanceId: string;

  @ApiProperty()
  @IsUUID()
  stepId: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  assigneeRoleId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  assigneeId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  comments?: string;

  @ApiPropertyOptional()
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  dueDate?: Date;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
