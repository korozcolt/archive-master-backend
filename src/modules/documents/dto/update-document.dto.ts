import { IsEnum, IsObject, IsOptional, IsString } from 'class-validator';

import { ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentStatus } from '../enums/document-status.enum';
import { DocumentType } from '../enums/document-type.enum';

export class UpdateDocumentDto {
  @ApiPropertyOptional({ example: 'Nuevo título del documento' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 'Nueva descripción' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    enum: DocumentType,
    example: DocumentType.CONTRACT,
  })
  @IsEnum(DocumentType)
  @IsOptional()
  type?: DocumentType;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({
    enum: DocumentStatus,
    example: DocumentStatus.APPROVED,
  })
  @IsEnum(DocumentStatus)
  @IsOptional()
  status?: DocumentStatus;
}
