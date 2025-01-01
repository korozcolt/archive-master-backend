// src/modules/search/dto/search-result.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { DocumentResponseDto } from '@/modules/documents/dto/document-response.dto';

export class SearchResultDto {
  @ApiProperty({ type: [DocumentResponseDto] })
  items: DocumentResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  lastPage: number;

  @ApiProperty({ type: [String] })
  highlights?: string[];
}
