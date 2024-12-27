export const CATEGORY_CACHE = {
  PREFIX: 'categories',
  TTL: {
    DEFAULT: 3600, // 1 hora
    TREE: 7200, // 2 horas
    METADATA: 43200, // 12 horas
  },
  PATTERNS: {
    ALL: 'categories:*',
    SINGLE: (id: string) => `categories:category:${id}`,
    TREE: 'categories:tree',
  },
};
