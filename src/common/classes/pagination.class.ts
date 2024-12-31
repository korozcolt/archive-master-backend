// src/common/classes/pagination.class.ts

import { ApiProperty } from '@nestjs/swagger';
import { Document } from '@/modules/documents/entities/document.entity';

export class PaginationMeta {
  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  lastPage: number;

  @ApiProperty()
  limit: number;
}

export class PaginatedResponseDto<T> {
  @ApiProperty({ isArray: true })
  data: T[];

  @ApiProperty()
  meta: PaginationMeta;
}

// Para el documento específicamente:
export class PaginatedDocumentResponseDto extends PaginatedResponseDto<Document> {
  @ApiProperty({ type: [Document] })
  data: Document[];
}
