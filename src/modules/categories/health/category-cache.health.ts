// src/modules/categories/health/category-cache.health.ts

import { HealthCheckError, HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';

import { CACHE_PREFIXES } from '@/common/constants/cache.constants';
import { CacheManagerService } from '@/config/redis/cache-manager.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CategoryCacheHealthIndicator extends HealthIndicator {
  constructor(private readonly cacheManager: CacheManagerService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // Intentar operación de caché
      await this.cacheManager.set('health-check-key', 'health-check', {
        prefix: CACHE_PREFIXES.CATEGORIES,
        ttl: 30,
      });

      const value = await this.cacheManager.get('health-check-key', {
        prefix: CACHE_PREFIXES.CATEGORIES,
      });

      const isHealthy = value === 'health-check';

      if (isHealthy) {
        await this.cacheManager.delete('health-check-key', CACHE_PREFIXES.CATEGORIES);
        return this.getStatus(key, true);
      }

      throw new Error('Cache check failed');
    } catch (error) {
      throw new HealthCheckError(
        'CategoryCacheCheck failed',
        this.getStatus(key, false, {
          message: error instanceof Error ? error.message : String(error),
        }),
      );
    }
  }
}
