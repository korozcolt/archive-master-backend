import { DocumentResponseDto } from '@/modules/documents/dto/document-response.dto';
import { UserResponseDto } from '@/modules/users/dto/user-response.dto';
import { WorkflowDefinitionResponseDto } from '../workflow-definition/workflow-definition-response.dto';
import { WorkflowStepResponseDto } from '../workflow-step/workflow-step-response.dto';
import { WorkflowTaskResponseDto } from '../workflow-task/workflow-task-response.dto';

export class WorkflowInstanceResponseDto {
  id: string;
  workflowDefinition: WorkflowDefinitionResponseDto;
  document: DocumentResponseDto;
  currentStep: WorkflowStepResponseDto;
  status: string;
  metadata?: Record<string, any>;
  tasks?: WorkflowTaskResponseDto[];
  createdBy?: UserResponseDto;
  updatedBy?: UserResponseDto;
  createdAt: Date;
  updatedAt: Date;
  currentTask?: WorkflowTaskResponseDto;
}
