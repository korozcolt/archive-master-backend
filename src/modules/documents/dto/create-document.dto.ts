import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsObject, IsOptional, IsString } from 'class-validator';

import { DocumentType } from '../enums/document-type.enum';

export class CreateDocumentDto {
  @ApiProperty({ example: 'Contrato de Servicio' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'Descripción del documento' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    enum: DocumentType,
    example: DocumentType.CONTRACT,
  })
  @IsEnum(DocumentType)
  type: DocumentType;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  initialContent?: string;
}
