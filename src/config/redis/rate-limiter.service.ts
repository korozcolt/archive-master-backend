import { Injectable } from '@nestjs/common';
import { RedisService } from './redis-cache.service';

@Injectable()
export class RateLimiterService {
  constructor(private redisService: RedisService) {}

  async checkRateLimit(identifier: string, limit = 100, windowInSeconds = 3600): Promise<boolean> {
    const key = `rate_limit:${identifier}`;
    const currentCount = (await this.redisService.get<number>(key)) || 0;

    if (currentCount >= limit) {
      return false;
    }

    await this.redisService.set(key, currentCount + 1, windowInSeconds);
    return true;
  }
}
