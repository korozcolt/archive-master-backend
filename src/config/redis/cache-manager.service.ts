// src/config/redis/cache-manager.service.ts

import { Injectable, Logger } from '@nestjs/common';

import { RedisService } from './redis-cache.service';

export interface CacheConfig {
  ttl?: number;
  prefix?: string;
}

@Injectable()
export class CacheManagerService {
  private readonly logger = new Logger(CacheManagerService.name);
  private readonly defaultTTL = 3600; // 1 hora por defecto

  constructor(private readonly redisService: RedisService) {}

  async get<T>(key: string, config?: CacheConfig): Promise<T | null> {
    try {
      const cacheKey = this.generateKey(key, config?.prefix);
      const value = await this.redisService.get<T>(cacheKey);

      if (!value) {
        this.logger.debug(`Cache miss for key: ${cacheKey}`);
        return null;
      }

      this.logger.debug(`Cache hit for key: ${cacheKey}`);
      return value;
    } catch (error) {
      this.logger.error(`Error getting cache key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: any, config?: CacheConfig): Promise<void> {
    try {
      const cacheKey = this.generateKey(key, config?.prefix);
      await this.redisService.set(cacheKey, value, config?.ttl || this.defaultTTL);
      this.logger.debug(`Cache set for key: ${cacheKey}`);
    } catch (error) {
      this.logger.error(`Error setting cache key ${key}:`, error);
    }
  }

  async delete(key: string, prefix?: string): Promise<void> {
    try {
      const cacheKey = this.generateKey(key, prefix);
      await this.redisService.del(cacheKey);
      this.logger.debug(`Cache deleted for key: ${cacheKey}`);
    } catch (error) {
      this.logger.error(`Error deleting cache key ${key}:`, error);
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const client = this.redisService.getClient();
      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        await client.del(...keys);
        this.logger.debug(`Cache invalidated for pattern: ${pattern}`);
      }
    } catch (error) {
      this.logger.error(`Error invalidating cache pattern ${pattern}:`, error);
    }
  }

  async getOrSet<T>(key: string, callback: () => Promise<T>, config?: CacheConfig): Promise<T> {
    try {
      const cachedValue = await this.get<T>(key, config);
      if (cachedValue) {
        return cachedValue;
      }

      const value = await callback();
      await this.set(key, value, config);
      return value;
    } catch (error) {
      this.logger.error(`Error in getOrSet for key ${key}:`, error);
      return callback();
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const client = this.redisService.getClient();
      await client.ping();
      return true;
    } catch (error) {
      this.logger.error('Redis health check failed:', error);
      return false;
    }
  }

  private generateKey(key: string, prefix?: string): string {
    return prefix ? `${prefix}:${key}` : key;
  }
}
