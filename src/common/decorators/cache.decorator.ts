// src/common/decorators/cache.decorator.ts

import { CacheManagerService } from '@/config/redis/cache-manager.service';
import { Logger } from '@nestjs/common';

interface CacheOptions {
  ttl?: number;
  prefix?: string;
  keyGenerator?: (...args: any[]) => string;
}

interface CacheableTarget {
  cacheManager: CacheManagerService;
}

export function Cacheable(options: CacheOptions = {}) {
  const logger = new Logger('CacheDecorator');

  return function (target: object, propertyKey: string, descriptor: TypedPropertyDescriptor<any>) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (this: CacheableTarget, ...args: any[]) {
      if (!this.cacheManager) {
        logger.warn(`CacheManager not found in ${target.constructor.name}`);
        return originalMethod.apply(this, args);
      }

      const cacheKey = options.keyGenerator
        ? options.keyGenerator(...args)
        : `${target.constructor.name}:${propertyKey}:${JSON.stringify(args)}`;

      return this.cacheManager.getOrSet(cacheKey, () => originalMethod.apply(this, args), options);
    };

    return descriptor;
  };
}

export function CacheEvict(pattern: string) {
  const logger = new Logger('CacheEvict');

  return function (target: object, propertyKey: string, descriptor: TypedPropertyDescriptor<any>) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (this: CacheableTarget, ...args: any[]) {
      if (!this.cacheManager) {
        logger.warn(`CacheManager not found in ${target.constructor.name}`);
        return originalMethod.apply(this, args);
      }

      try {
        const result = await originalMethod.apply(this, args);
        await this.cacheManager.invalidatePattern(pattern);
        return result;
      } catch (error) {
        logger.error(`Cache eviction error in ${target.constructor.name}:`, error);
        return originalMethod.apply(this, args);
      }
    };

    return descriptor;
  };
}
