// src/common/health/cache.health.ts

import { HealthCheckError, HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { Injectable, Logger } from '@nestjs/common';

import { CacheManagerService } from '@/config/redis/cache-manager.service';

@Injectable()
export class CacheHealthIndicator extends HealthIndicator {
  private readonly logger = new Logger(CacheHealthIndicator.name);

  constructor(private readonly cacheManager: CacheManagerService) {
    super();
  }

  private formatError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }

  async check(key: string): Promise<HealthIndicatorResult> {
    try {
      const checks = await Promise.all([
        this.checkWrite(),
        this.checkRead(),
        this.checkDelete(),
        this.checkExpiration(),
      ]);

      const isHealthy = checks.every((check) => check.isHealthy);
      const details = checks.reduce(
        (acc, check) => ({
          ...acc,
          ...check.details,
        }),
        {},
      );

      if (isHealthy) {
        return this.getStatus(key, true, details);
      }

      throw new HealthCheckError('Cache check failed', this.getStatus(key, false, details));
    } catch (error) {
      this.logger.error(`Cache health check failed: ${this.formatError(error)}`);
      throw new HealthCheckError(
        'Cache check failed',
        this.getStatus(key, false, { error: this.formatError(error) }),
      );
    }
  }

  private async checkWrite(): Promise<{ isHealthy: boolean; details: Record<string, any> }> {
    try {
      const testKey = 'health:write';
      const testValue = { test: true, timestamp: Date.now() };

      await this.cacheManager.set(testKey, testValue, { prefix: 'health', ttl: 30 });

      return {
        isHealthy: true,
        details: { write: 'successful' },
      };
    } catch (error) {
      this.logger.error(`Write check failed: ${this.formatError(error)}`);
      return {
        isHealthy: false,
        details: { write: `failed: ${this.formatError(error)}` },
      };
    }
  }

  private async checkRead(): Promise<{ isHealthy: boolean; details: Record<string, any> }> {
    try {
      const testKey = 'health:read';
      const testValue = { test: true, timestamp: Date.now() };

      await this.cacheManager.set(testKey, testValue, { prefix: 'health', ttl: 30 });
      const retrieved = await this.cacheManager.get(testKey, { prefix: 'health' });

      const isMatch = JSON.stringify(retrieved) === JSON.stringify(testValue);

      return {
        isHealthy: isMatch,
        details: { read: isMatch ? 'successful' : 'value mismatch' },
      };
    } catch (error) {
      this.logger.error(`Read check failed: ${this.formatError(error)}`);
      return {
        isHealthy: false,
        details: { read: `failed: ${this.formatError(error)}` },
      };
    }
  }

  private async checkDelete(): Promise<{ isHealthy: boolean; details: Record<string, any> }> {
    try {
      const testKey = 'health:delete';
      const testValue = { test: true };

      await this.cacheManager.set(testKey, testValue, { prefix: 'health', ttl: 30 });
      await this.cacheManager.delete(testKey, 'health');

      const retrieved = await this.cacheManager.get(testKey, { prefix: 'health' });

      return {
        isHealthy: retrieved === null,
        details: { delete: retrieved === null ? 'successful' : 'failed to delete' },
      };
    } catch (error) {
      this.logger.error(`Delete check failed: ${this.formatError(error)}`);
      return {
        isHealthy: false,
        details: { delete: `failed: ${this.formatError(error)}` },
      };
    }
  }

  private async checkExpiration(): Promise<{ isHealthy: boolean; details: Record<string, any> }> {
    try {
      const testKey = 'health:expiration';
      const testValue = { test: true };

      // Set with 1 second TTL
      await this.cacheManager.set(testKey, testValue, { prefix: 'health', ttl: 1 });

      // Wait 1.5 seconds
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const retrieved = await this.cacheManager.get(testKey, { prefix: 'health' });

      return {
        isHealthy: retrieved === null,
        details: { expiration: retrieved === null ? 'successful' : 'failed to expire' },
      };
    } catch (error) {
      this.logger.error(`Expiration check failed: ${this.formatError(error)}`);
      return {
        isHealthy: false,
        details: { expiration: `failed: ${this.formatError(error)}` },
      };
    }
  }
}
