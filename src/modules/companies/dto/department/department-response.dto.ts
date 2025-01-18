import { BranchResponseDto } from '../branch/branch-response.dto';
import { UserResponseDto } from '@/modules/users/dto/user-response.dto';

export class DepartmentResponseDto {
  id: string;
  branch: BranchResponseDto;
  parent?: DepartmentResponseDto;
  children?: DepartmentResponseDto[];
  name: string;
  code: string;
  description?: string;
  manager?: UserResponseDto;
  users?: UserResponseDto[];
  isActive: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
