import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';

export class CreateDocumentVersionDto {
  @ApiProperty({ example: 'Contenido de la versión del documento' })
  @IsString()
  content: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  changes?: Record<string, any>;
}
