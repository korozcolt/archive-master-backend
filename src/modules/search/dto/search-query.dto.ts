// src/modules/search/dto/search-query.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsDateString, IsEnum, IsObject, IsOptional, IsString } from 'class-validator';

import { DocumentType } from '@/modules/documents/enums/document-type.enum';
import { Type } from 'class-transformer';

export class SearchQueryDto {
  @ApiProperty({ description: 'Texto a buscar' })
  @IsString()
  query: string;

  @ApiPropertyOptional({ description: 'Filtrar por tipo de documento' })
  @IsEnum(DocumentType)
  @IsOptional()
  type?: DocumentType;

  @ApiPropertyOptional({ description: 'Filtrar por categorías' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  categoryIds?: string[];

  @ApiPropertyOptional({ description: 'Fecha desde' })
  @IsDateString()
  @IsOptional()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'Fecha hasta' })
  @IsDateString()
  @IsOptional()
  toDate?: string;

  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @Type(() => Number)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Filtros de metadatos' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
