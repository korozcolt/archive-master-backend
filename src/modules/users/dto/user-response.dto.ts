/* eslint-disable @typescript-eslint/no-unused-vars */
// src/modules/users/dto/user-response.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Transform } from 'class-transformer';

import { Role } from '../../roles/entities/role.entity';

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  // Usar un truco para manejar el password sin incluirlo
  @Exclude({ toPlainOnly: true })
  private readonly _password?: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  isActive: boolean;

  @ApiPropertyOptional()
  @Transform(({ value }) =>
    value
      ? {
          id: value.id,
          name: value.name,
        }
      : null,
  )
  role?: Role;

  @ApiPropertyOptional()
  lastLogin?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(data?: Partial<UserResponseDto>) {
    if (data) {
      // Excluir explícitamente el password
      const { _password, ...safeData } = data as any;
      Object.assign(this, safeData);
    }
  }

  // Método estático para crear un DTO seguro
  static create(user: any): UserResponseDto {
    const { password, ...safeUser } = user;
    return new UserResponseDto(safeUser);
  }
}
