// src/modules/search/interfaces/search-options.interface.ts

export interface SearchOptions {
  type?: string;
  categoryIds?: string[];
  fromDate?: Date;
  toDate?: Date;
  page?: number;
  limit?: number;
  status?: string;
  createdById?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  metadata?: Record<string, any>;
}
