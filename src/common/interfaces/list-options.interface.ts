// src/common/interfaces/list-options.interface.ts
export interface ListOptions {
  // Paginación
  page: number;
  limit: number;

  // Ordenamiento
  sort: {
    field: string;
    order: 'ASC' | 'DESC';
  }[];

  // Filtros
  filters: {
    field: string;
    operator: 'eq' | 'like' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'between';
    value: any;
  }[];
}

export interface ListResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    lastPage: number;
    limit: number;
  };
}
