import { RoleResponseDto } from '@/modules/roles/dto/role-response.dto';
import { UserResponseDto } from '@/modules/users/dto/user-response.dto';
import { WorkflowStepResponseDto } from '../workflow-step/workflow-step-response.dto';

// src/modules/workflow/dto/workflow-transition/workflow-transition-response.dto.ts
export class WorkflowTransitionResponseDto {
  id: string;
  name: string;
  description?: string;
  fromStep?: WorkflowStepResponseDto;
  toStep: WorkflowStepResponseDto;
  requiredRole?: RoleResponseDto;
  requiresComment: boolean;
  conditions?: Record<string, any>;
  isActive: boolean;
  createdBy?: UserResponseDto;
  updatedBy?: UserResponseDto;
  createdAt: Date;
  updatedAt: Date;
}
