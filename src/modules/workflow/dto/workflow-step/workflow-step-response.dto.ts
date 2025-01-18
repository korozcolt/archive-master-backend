import { RoleResponseDto } from '@/modules/roles/dto/role-response.dto';
import { StatusResponseDto } from '@/modules/status/dto/status-response.dto';
import { UserResponseDto } from '@/modules/users/dto/user-response.dto';

export class WorkflowStepResponseDto {
  id: string;
  name: string;
  description?: string;
  status: StatusResponseDto;
  assigneeRole?: RoleResponseDto;
  config?: Record<string, any>;
  isActive: boolean;
  createdBy?: UserResponseDto;
  updatedBy?: UserResponseDto;
  createdAt: Date;
  updatedAt: Date;
}
