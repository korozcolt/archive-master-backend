import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';

import { FieldSchema } from './field-schema.dto';
import { Type } from 'class-transformer';

// src/modules/templates/dto/create-template-version.dto.ts
export class CreateTemplateVersionDto {
  @ApiProperty()
  @IsString()
  changeNotes: string;

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
}
