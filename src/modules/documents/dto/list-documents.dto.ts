// src/modules/documents/dto/list-documents.dto.ts

import { IsArray, IsEnum, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';

import { ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentType } from '../enums/document-type.enum';

class SortDto {
  @IsString()
  field: string;

  @IsEnum(['ASC', 'DESC'])
  order: 'ASC' | 'DESC';
}

class FilterDto {
  @IsString()
  field: string;

  @IsEnum(['eq', 'like', 'gt', 'lt', 'gte', 'lte', 'in', 'between'])
  operator: string;

  @Transform(({ value }) => {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  })
  value: any;
}

export class ListDocumentsDto {
  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional()
  @Type(() => SortDto)
  @IsArray()
  @ValidateNested({ each: true })
  @IsOptional()
  sort?: SortDto[] = [{ field: 'createdAt', order: 'DESC' }];

  @ApiPropertyOptional()
  @Type(() => FilterDto)
  @IsArray()
  @ValidateNested({ each: true })
  @IsOptional()
  filters?: FilterDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: DocumentType })
  @IsOptional()
  @IsEnum(DocumentType)
  type?: DocumentType;
}
