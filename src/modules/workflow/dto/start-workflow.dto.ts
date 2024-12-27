// src/modules/workflow/dto/start-workflow.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, IsUUID } from 'class-validator';

export class StartWorkflowDto {
  @ApiProperty({ description: 'Document ID' })
  @IsUUID()
  documentId: string;

  @ApiProperty({ description: 'Workflow Definition ID' })
  @IsUUID()
  workflowDefinitionId: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

// src/modules/workflow/dto/transition-workflow.dto.ts
export class TransitionWorkflowDto {
  @ApiProperty({ description: 'Transition ID' })
  @IsUUID()
  transitionId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  comment?: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

// src/modules/workflow/dto/cancel-workflow.dto.ts
export class CancelWorkflowDto {
  @ApiProperty({ description: 'Cancellation reason' })
  @IsString()
  reason: string;
}
