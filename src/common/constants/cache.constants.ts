// src/common/constants/cache.constants.ts

export const CACHE_TTL = {
  SHORT: 300, // 5 minutos
  MEDIUM: 1800, // 30 minutos
  LONG: 3600, // 1 hora
  EXTENDED: 7200, // 2 horas
  DAY: 86400, // 24 horas
  WEEK: 604800, // 1 semana
} as const;

export const CACHE_PREFIXES = {
  BRANCHES: 'branches',
  CATEGORIES: 'categories',
  CONFIGURATIONS: 'configs',
  COMPANIES: 'companies',
  DOCUMENTS: 'documents',
  DEPARTMENTS: 'departments',
  STATUS: 'status',
  TAGS: 'tags',
  TEMPLATES: 'templates',
  WORKFLOWS: 'workflows',
  USERS: 'users',
  HEALTH: 'health',
  SYSTEM: 'system',
} as const;

export type CachePattern = string | ((param?: any) => string);

export const CACHE_PATTERNS = {
  BRANCHES: {
    ALL: 'branches:*',
    SINGLE: (id: string): string => `branches:${id}`,
    BY_COMPANY: (companyId: string): string => `branches:company:${companyId}:*`,
    ACTIVE: 'branches:active:*',
  },

  CATEGORIES: {
    ALL: 'categories:*',
    SINGLE: (id: string): string => `categories:${id}`,
    TREE: 'categories:tree:*',
    METADATA: 'categories:metadata:*',
    BY_PARENT: (parentId: string): string => `categories:parent:${parentId}:*`,
    ACTIVE: 'categories:active:*',
    INACTIVE: 'categories:inactive:*',
    SLUG: (slug: string): string => `categories:slug:${slug}`,
  },

  CONFIGURATIONS: {
    ALL: 'configs:*',
    PUBLIC: 'configs:public:*',
    GROUPS: 'configs:groups:*',
    SINGLE: (id: string): string => `configs:config:${id}`,
    GROUP: (id: string): string => `configs:group:${id}`,
    VALUES: 'configs:values:*',
    BY_GROUP: (groupId: string): string => `configs:byGroup:${groupId}:*`,
    HISTORY: (configId: string): string => `configs:history:${configId}:*`,
  },

  COMPANIES: {
    ALL: 'companies:*',
    SINGLE: (id: string): string => `companies:${id}`,
    BY_USER: (userId: string): string => `companies:user:${userId}:*`,
    BY_BRANCH: (branchId: string): string => `companies:branch:${branchId}:*`,
    ACTIVE: 'companies:active:*',
    INACTIVE: 'companies:inactive:*',
  },

  DOCUMENTS: {
    ALL: 'documents:*',
    SINGLE: (id: string): string => `documents:${id}`,
    BY_TYPE: (type: string): string => `documents:type:${type}:*`,
    BY_STATUS: (status: string): string => `documents:status:${status}:*`,
    BY_CATEGORY: (categoryId: string): string => `documents:category:${categoryId}:*`,
    RECENT: 'documents:recent:*',
    STATS: 'documents:stats',
    VERSIONS: (documentId: string): string => `documents:${documentId}:versions:*`,
    METADATA: (documentId: string): string => `documents:${documentId}:metadata`,
  },

  DEPARTMENTS: {
    ALL: 'departments:*',
    SINGLE: (id: string): string => `departments:${id}`,
    BY_BRANCH: (branchId: string): string => `departments:branch:${branchId}:*`,
    ACTIVE: 'departments:active:*',
  },

  STATUS: {
    ALL: 'status:*',
    SINGLE: (id: string): string => `status:status:${id}`,
    TRANSITIONS: 'status:transitions:*',
    AVAILABLE: (statusId: string): string => `status:available:${statusId}:*`,
    BY_CODE: (code: string): string => `status:code:${code}:*`,
    ACTIVE: 'status:active:*',
    WORKFLOW: (workflowId: string): string => `status:workflow:${workflowId}:*`,
  },

  TAGS: {
    ALL: 'tags:*',
    SINGLE: (id: string) => `tags:${id}`,
    TREE: 'tags:tree:*',
    RELATED: (id: string) => `tags:related:${id}`,
    ACTIVE: 'tags:active:*',
    INACTIVE: 'tags:inactive:*',
    HIERARCHY: 'tags:hierarchy:*',
  },

  TEMPLATES: {
    ALL: 'templates:*',
    SINGLE: (id: string): string => `templates:template:${id}`,
    VERSIONS: (id: string): string => `templates:versions:${id}:*`,
    BY_CATEGORY: (categoryId: string): string => `templates:category:${categoryId}:*`,
    ACTIVE: 'templates:active:*',
    FIELDS: (templateId: string): string => `templates:fields:${templateId}:*`,
    METADATA: (templateId: string): string => `templates:metadata:${templateId}:*`,
  },

  WORKFLOWS: {
    ALL: 'workflows:*',
    DEFINITIONS: 'workflows:definitions:*',
    DEFINITION: (id: string): string => `workflows:definition:${id}:*`,
    INSTANCES: 'workflows:instances:*',
    INSTANCE: (id: string): string => `workflows:instance:${id}:*`,
    TASKS: 'workflows:tasks:*',
    TASK: (id: string): string => `workflows:task:${id}:*`,
    BY_STATUS: (statusId: string): string => `workflows:status:${statusId}:*`,
    BY_USER: (userId: string): string => `workflows:user:${userId}:*`,
    HISTORY: (workflowId: string): string => `workflows:history:${workflowId}:*`,
  },

  USERS: {
    ALL: 'users:*',
    SINGLE: (id: string): string => `users:user:${id}`,
    PUBLIC: 'users:public:*',
    ROLES: 'users:roles:*',
    BY_ROLE: (roleId: string): string => `users:byRole:${roleId}:*`,
    PERMISSIONS: (userId: string): string => `users:permissions:${userId}:*`,
    PREFERENCES: (userId: string): string => `users:preferences:${userId}:*`,
    SESSIONS: (userId: string): string => `users:sessions:${userId}:*`,
    ACTIVE: 'users:active:*',
    TOKEN: 'users:token:*',
    TOKEN_VALIDATE: 'users:token:validate:*',
    AUTH: 'users:auth:*',
  },

  HEALTH: {
    CHECKS: 'health:checks:*',
    STATUS: 'health:status:*',
    METRICS: 'health:metrics:*',
  },

  SYSTEM: {
    CONFIG: 'system:config:*',
    METRICS: 'system:metrics:*',
    LOGS: 'system:logs:*',
  },
} as const;

export const CACHE_CONFIG = {
  BRANCHES: {
    DEFAULT_TTL: CACHE_TTL.EXTENDED,
    ACTIVE_TTL: CACHE_TTL.DAY,
  },

  CATEGORIES: {
    DEFAULT_TTL: CACHE_TTL.LONG,
    TREE_TTL: CACHE_TTL.EXTENDED,
    METADATA_TTL: CACHE_TTL.DAY,
    ACTIVE_TTL: CACHE_TTL.EXTENDED,
  },

  CONFIGURATIONS: {
    DEFAULT_TTL: CACHE_TTL.LONG,
    PUBLIC_TTL: CACHE_TTL.DAY,
    GROUPS_TTL: CACHE_TTL.EXTENDED,
    HISTORY_TTL: CACHE_TTL.WEEK,
  },

  COMPANIES: {
    DEFAULT_TTL: CACHE_TTL.EXTENDED,
    ACTIVE_TTL: CACHE_TTL.DAY,
  },

  DOCUMENTS: {
    DEFAULT_TTL: CACHE_TTL.MEDIUM, // 30 minutos
    METADATA_TTL: CACHE_TTL.LONG, // 1 hora
    STATS_TTL: CACHE_TTL.EXTENDED, // 2 horas
    RECENT_TTL: CACHE_TTL.SHORT, // 5 minutos
    VERSIONS_TTL: CACHE_TTL.DAY, // 24 horas
  },

  DEPARTMENTS: {
    DEFAULT_TTL: CACHE_TTL.EXTENDED,
    ACTIVE_TTL: CACHE_TTL.DAY,
    TREE_TTL: CACHE_TTL.EXTENDED,
  },

  STATUS: {
    DEFAULT_TTL: CACHE_TTL.EXTENDED,
    TRANSITIONS_TTL: CACHE_TTL.LONG,
    ACTIVE_TTL: CACHE_TTL.DAY,
  },

  TAGS: {
    DEFAULT_TTL: CACHE_TTL.EXTENDED,
    TREE_TTL: CACHE_TTL.EXTENDED,
    RELATED_TTL: CACHE_TTL.LONG,
    ACTIVE_TTL: CACHE_TTL.DAY,
    HIERARCHY_TTL: CACHE_TTL.DAY,
  },

  TEMPLATES: {
    DEFAULT_TTL: CACHE_TTL.EXTENDED,
    VERSIONS_TTL: CACHE_TTL.LONG,
    FIELDS_TTL: CACHE_TTL.DAY,
    METADATA_TTL: CACHE_TTL.DAY,
  },

  WORKFLOWS: {
    DEFAULT_TTL: CACHE_TTL.MEDIUM,
    DEFINITIONS_TTL: CACHE_TTL.EXTENDED,
    INSTANCES_TTL: CACHE_TTL.SHORT,
    TASKS_TTL: CACHE_TTL.SHORT,
    HISTORY_TTL: CACHE_TTL.WEEK,
  },

  USERS: {
    DEFAULT_TTL: CACHE_TTL.MEDIUM,
    PUBLIC_TTL: CACHE_TTL.DAY,
    ROLES_TTL: CACHE_TTL.DAY,
    SESSIONS_TTL: CACHE_TTL.MEDIUM,
    PREFERENCES_TTL: CACHE_TTL.DAY,
    PERMISSIONS_TTL: CACHE_TTL.DAY,
  },

  HEALTH: {
    CHECKS_TTL: CACHE_TTL.SHORT,
    STATUS_TTL: CACHE_TTL.SHORT,
    METRICS_TTL: CACHE_TTL.MEDIUM,
  },

  SYSTEM: {
    CONFIG_TTL: CACHE_TTL.EXTENDED,
    METRICS_TTL: CACHE_TTL.SHORT,
    LOGS_TTL: CACHE_TTL.MEDIUM,
  },
} as const;

export function evaluatePattern(pattern: CachePattern, ...params: any[]): string {
  return typeof pattern === 'function' ? pattern(...params) : pattern;
}
