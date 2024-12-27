import { UserResponseDto } from '@/modules/users/dto/user-response.dto';
import { WorkflowStepResponseDto } from '../workflow-step/workflow-step-response.dto';
import { WorkflowTransitionResponseDto } from '../workflow-transition/workflow-transition-response.dto';

// src/modules/workflow/dto/workflow-definition/workflow-definition-response.dto.ts
export class WorkflowDefinitionResponseDto {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  steps?: WorkflowStepResponseDto[];
  transitions?: WorkflowTransitionResponseDto[];
  createdBy?: UserResponseDto;
  updatedBy?: UserResponseDto;
  createdAt: Date;
  updatedAt: Date;
}
