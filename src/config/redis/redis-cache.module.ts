// src/config/redis/redis-cache.module.ts

import { ConfigModule, ConfigService } from '@nestjs/config';
import { Global, Module } from '@nestjs/common';

import { CacheManagerService } from './cache-manager.service';
import { JwtModule } from '@nestjs/jwt';
import { RateLimiterService } from './rate-limiter.service';
import { RedisService } from './redis-cache.service';
import { SessionService } from './session.service';

@Global()
@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRATION', '1d'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    RedisService,
    RateLimiterService,
    SessionService,
    CacheManagerService,
    {
      provide: 'REDIS_CLIENT',
      useFactory: (redisService: RedisService) => redisService.getClient(),
      inject: [RedisService],
    },
  ],
  exports: [RedisService, RateLimiterService, SessionService, CacheManagerService, 'REDIS_CLIENT'],
})
export class RedisModule {}
