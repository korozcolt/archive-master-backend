import { IsArray, IsBoolean, IsEnum, IsObject, IsOptional, IsString } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export enum FieldType {
  TEXT = 'text',
  NUMBER = 'number',
  DATE = 'date',
  SELECT = 'select',
  MULTISELECT = 'multiselect',
  BOOLEAN = 'boolean',
  FILE = 'file',
  RICH_TEXT = 'rich_text',
}

export class FieldSchema {
  @ApiProperty({ enum: FieldType })
  @IsEnum(FieldType)
  type: FieldType;

  @ApiProperty()
  @IsString()
  label: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  required?: boolean;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  validations?: Record<string, any>;

  @ApiProperty({ required: false })
  @IsArray()
  @IsOptional()
  options?: string[];

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  defaultValue?: any;
}
