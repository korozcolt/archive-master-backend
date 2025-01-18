// src/modules/tags/dto/tag-response.dto.ts
export class TagResponseDto {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
  isActive: boolean;
  parentId?: string;
  createdById?: string;
  updatedById?: string;
  createdAt: Date;
  updatedAt: Date;
  children?: TagResponseDto[];
  relations?: {
    related: TagResponseDto[];
    synonyms: TagResponseDto[];
  };
}
