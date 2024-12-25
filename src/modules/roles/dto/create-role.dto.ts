// src/modules/roles/dto/create-role.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ example: 'admin', description: 'The name of the role' })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    example: 'Administrator role',
    description: 'Role description',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Array of permission IDs',
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  permissionIds?: string[];
}
