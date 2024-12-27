import { RoleResponseDto } from '@/modules/roles/dto/role-response.dto';
import { UserResponseDto } from '@/modules/users/dto/user-response.dto';
import { WorkflowInstanceResponseDto } from '../workflow-instance/workflow-instance-response.dto';
import { WorkflowStepResponseDto } from '../workflow-step/workflow-step-response.dto';

export class WorkflowTaskResponseDto {
  id: string;
  workflowInstance: WorkflowInstanceResponseDto;
  step: WorkflowStepResponseDto;
  assigneeRole?: RoleResponseDto;
  assignee?: UserResponseDto;
  status: string;
  comments?: string;
  dueDate?: Date;
  metadata?: Record<string, any>;
  createdBy?: UserResponseDto;
  updatedBy?: UserResponseDto;
  createdAt: Date;
  updatedAt: Date;
}
