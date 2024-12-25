import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Transform } from 'class-transformer';

import { Role } from '../../roles/entities/role.entity';

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @Exclude()
  password: string;

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
      Object.assign(this, data);
    }
  }
}
