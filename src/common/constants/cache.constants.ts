// src/common/constants/cache.constants.ts

export const CACHE_TTL = {
  SHORT: 300, // 5 minutos
  MEDIUM: 1800, // 30 minutos
  LONG: 3600, // 1 hora
  EXTENDED: 7200, // 2 horas
  DAY: 86400, // 24 horas
  WEEK: 604800, // 1 semana
};

export const CACHE_PREFIXES = {
  CATEGORIES: 'categories',
  CONFIGURATIONS: 'configs',
  DOCUMENTS: 'documents',
  STATUS: 'status',
  TAGS: 'tags',
  TEMPLATES: 'templates',
  WORKFLOWS: 'workflows',
  USERS: 'users',
};

export const CACHE_PATTERNS = {
  CATEGORIES: {
    ALL: 'categories:*',
    SINGLE: (id: string) => `categories:category:${id}`,
    TREE: 'categories:tree',
    METADATA: 'categories:metadata',
  },

  CONFIGURATIONS: {
    ALL: 'configs:*',
    PUBLIC: 'configs:public:*',
    GROUPS: 'configs:groups:*',
    SINGLE: (id: string) => `configs:config:${id}`,
    GROUP: (id: string) => `configs:group:${id}`,
    VALUES: 'configs:values:*',
  },

  DOCUMENTS: {
    ALL: 'documents:*',
    SINGLE: (id: string) => `documents:document:${id}`,
    TYPE: (type: string) => `documents:type:${type}`,
    RECENT: 'documents:recent',
    STATS: 'documents:stats',
  },

  STATUS: {
    ALL: 'status:*',
    SINGLE: (id: string) => `status:status:${id}`,
    TRANSITIONS: 'status:transitions:*',
    AVAILABLE: (statusId: string) => `status:available:${statusId}`,
  },

  TAGS: {
    ALL: 'tags:*',
    SINGLE: (id: string) => `tags:tag:${id}`,
    TREE: 'tags:tree',
    RELATED: (id: string) => `tags:related:${id}`,
  },

  TEMPLATES: {
    ALL: 'templates:*',
    SINGLE: (id: string) => `templates:template:${id}`,
    VERSIONS: (id: string) => `templates:versions:${id}`,
  },

  WORKFLOWS: {
    DEFINITIONS: 'workflows:definitions:*',
    INSTANCES: 'workflows:instances:*',
    TASKS: 'workflows:tasks:*',
  },

  USERS: {
    PUBLIC: 'users:public:*',
    ROLES: 'users:roles:*',
  },
};

export const CACHE_CONFIG = {
  CATEGORIES: {
    DEFAULT_TTL: CACHE_TTL.LONG,
    TREE_TTL: CACHE_TTL.EXTENDED,
    METADATA_TTL: CACHE_TTL.DAY,
  },

  CONFIGURATIONS: {
    DEFAULT_TTL: CACHE_TTL.LONG,
    PUBLIC_TTL: CACHE_TTL.DAY,
    GROUPS_TTL: CACHE_TTL.EXTENDED,
  },

  DOCUMENTS: {
    DEFAULT_TTL: CACHE_TTL.MEDIUM,
    METADATA_TTL: CACHE_TTL.LONG,
    STATS_TTL: CACHE_TTL.EXTENDED,
  },

  STATUS: {
    DEFAULT_TTL: CACHE_TTL.EXTENDED,
    TRANSITIONS_TTL: CACHE_TTL.LONG,
  },

  TAGS: {
    DEFAULT_TTL: CACHE_TTL.EXTENDED,
    TREE_TTL: CACHE_TTL.EXTENDED,
    RELATED_TTL: CACHE_TTL.LONG,
  },

  TEMPLATES: {
    DEFAULT_TTL: CACHE_TTL.EXTENDED,
    VERSIONS_TTL: CACHE_TTL.LONG,
  },

  WORKFLOWS: {
    DEFINITIONS_TTL: CACHE_TTL.EXTENDED,
    INSTANCES_TTL: CACHE_TTL.SHORT,
    TASKS_TTL: CACHE_TTL.SHORT,
  },

  USERS: {
    PUBLIC_TTL: CACHE_TTL.DAY,
    ROLES_TTL: CACHE_TTL.DAY,
  },
};
