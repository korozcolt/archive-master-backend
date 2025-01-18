import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { CategoryResponseDto } from '../../categories/dto/category-response.dto';
import { DocumentStatus } from '../enums/document-status.enum';
import { DocumentType } from '../enums/document-type.enum';
import { UserResponseDto } from '../../users/dto/user-response.dto';

export class DocumentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty({ enum: DocumentType })
  type: DocumentType;

  @ApiProperty({ enum: DocumentStatus })
  status: DocumentStatus;

  @ApiPropertyOptional()
  metadata?: Record<string, any>;

  @ApiProperty()
  currentVersionNumber: number;

  @ApiPropertyOptional()
  createdBy?: UserResponseDto;

  @ApiPropertyOptional()
  category?: CategoryResponseDto;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
