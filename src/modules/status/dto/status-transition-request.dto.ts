// src/modules/status/dto/status-transition-request.dto.ts

import { IsOptional, IsString } from 'class-validator';

import { ApiPropertyOptional } from '@nestjs/swagger';

export class StatusTransitionRequestDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  comment?: string;
}
