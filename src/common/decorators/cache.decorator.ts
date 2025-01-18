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

      try {
        const cacheKey = options.keyGenerator
          ? options.keyGenerator(...args)
          : `${target.constructor.name}:${propertyKey}:${JSON.stringify(args)}`;

        const cachedValue = await this.cacheManager.get(cacheKey, {
          prefix: options.prefix,
        });

        if (cachedValue !== null) {
          logger.debug(`Cache hit for key: ${cacheKey}`);
          return cachedValue;
        }

        const result = await originalMethod.apply(this, args);

        await this.cacheManager.set(cacheKey, result, {
          ttl: options.ttl,
          prefix: options.prefix,
        });

        return result;
      } catch (error) {
        logger.error(`Cache error in ${target.constructor.name}:`, error);
        return originalMethod.apply(this, args);
      }
    };

    return descriptor;
  };
}

export function CacheEvict(patterns: string | string[]) {
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

        // Manejar múltiples patrones
        const patternsToInvalidate = Array.isArray(patterns) ? patterns : [patterns];
        for (const pattern of patternsToInvalidate) {
          await this.cacheManager.invalidatePattern(pattern);
          logger.debug(`Cache invalidated for pattern: ${pattern}`);
        }

        return result;
      } catch (error) {
        logger.error(`Cache eviction error in ${target.constructor.name}:`, error);
        return originalMethod.apply(this, args);
      }
    };

    return descriptor;
  };
}
