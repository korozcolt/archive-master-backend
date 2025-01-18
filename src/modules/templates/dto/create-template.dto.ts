// src/modules/templates/dto/create-template.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

import { FieldSchema } from './field-schema.dto';
import { Type } from 'class-transformer';

export class CreateTemplateDto {
  @ApiProperty({ example: 'Invoice Template' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'INVOICE_TEMPLATE' })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  initialStatusId?: string;

  @ApiProperty()
  @IsObject()
  metadataSchema: Record<string, any>;

  @ApiProperty({ type: [FieldSchema] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FieldSchema)
  fieldsSchema: FieldSchema[];

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  validationRules?: Record<string, any>;

  @ApiPropertyOptional()
  @IsArray()
  @IsOptional()
  requiredFields?: string[];

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  defaultValues?: Record<string, any>;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
