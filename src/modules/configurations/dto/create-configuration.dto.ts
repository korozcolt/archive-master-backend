import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';

import { ConfigurationType } from '../entities/configuration.entity';

export class CreateConfigurationDto {
  @ApiProperty({ example: 'uuid' })
  @IsUUID()
  groupId: string;

  @ApiProperty({ example: 'SMTP Host' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'SMTP_HOST' })
  @IsString()
  @IsOptional()
  key?: string;

  @ApiProperty()
  @IsString()
  value: string;

  @ApiProperty({ enum: ConfigurationType })
  @IsEnum(ConfigurationType)
  type: ConfigurationType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  validationRules?: Record<string, any>;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isSystem?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isEncrypted?: boolean;
}
