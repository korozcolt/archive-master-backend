// src/modules/workflow/dto/workflow-instance/create-workflow-instance.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsUUID } from 'class-validator';

export class CreateWorkflowInstanceDto {
  @ApiProperty()
  @IsUUID()
  workflowDefinitionId: string;

  @ApiProperty()
  @IsUUID()
  documentId: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
