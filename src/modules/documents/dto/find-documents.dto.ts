// src/modules/documents/dto/find-documents.dto.ts

import { IsDate, IsEnum, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';

import { ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentType } from '../enums/document-type.enum';
import { Transform } from 'class-transformer';

export class FindDocumentsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: DocumentType })
  @IsOptional()
  @IsEnum(DocumentType)
  type?: DocumentType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  startDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  endDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
