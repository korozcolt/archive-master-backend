// src/modules/status/dto/status-response.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StatusResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  code: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  color: string;

  @ApiPropertyOptional()
  icon?: string;

  @ApiProperty()
  isActive: boolean;

  @ApiPropertyOptional()
  createdById?: string;

  @ApiPropertyOptional()
  updatedById?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
