import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private readonly redisClient: Redis;

  constructor(private configService: ConfigService) {
    this.redisClient = new Redis({
      host: this.configService.get('redis.host', 'localhost'),
      port: this.configService.get('redis.port', 6379),
      password: this.configService.get('redis.password'),
    });

    this.redisClient.on('error', (err) => {
      console.error('Redis Client Error', err);
    });
  }

  getClient(): Redis {
    return this.redisClient;
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    const stringValue = JSON.stringify(value);
    if (ttl) {
      await this.redisClient.setex(key, ttl, stringValue);
    } else {
      await this.redisClient.set(key, stringValue);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redisClient.get(key);
    return value ? JSON.parse(value) : null;
  }

  async del(key: string): Promise<void> {
    await this.redisClient.del(key);
  }

  async clearAll(): Promise<void> {
    await this.redisClient.flushdb();
  }
}
