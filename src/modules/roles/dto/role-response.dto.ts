// src/modules/roles/dto/role-response.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { Permission } from '../entities/permission.entity';

export class RoleResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  isActive: boolean;

  @ApiPropertyOptional({ type: () => [Permission] })
  permissions?: Permission[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
