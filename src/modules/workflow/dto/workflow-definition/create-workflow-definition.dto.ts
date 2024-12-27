// src/modules/workflow/dto/workflow-definition/create-workflow-definition.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsOptional, IsString, ValidateNested } from 'class-validator';

import { CreateWorkflowStepDto } from '../workflow-step/create-workflow-step.dto';
import { CreateWorkflowTransitionDto } from '../workflow-transition/create-workflow-transition.dto';
import { Type } from 'class-transformer';

export class CreateWorkflowDefinitionDto {
  @ApiProperty({ example: 'Invoice Approval Workflow' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'INVOICE_APPROVAL' })
  @IsString()
  code: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateWorkflowStepDto)
  steps?: CreateWorkflowStepDto[];

  @ApiPropertyOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateWorkflowTransitionDto)
  transitions?: CreateWorkflowTransitionDto[];
}
