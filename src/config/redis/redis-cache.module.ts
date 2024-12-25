import { ConfigModule, ConfigService } from '@nestjs/config';

import { JwtModule } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { RateLimiterService } from './rate-limiter.service';
import { RedisService } from './redis-cache.service';
import { SessionService } from './session.service';

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
  providers: [RedisService, RateLimiterService, SessionService],
  exports: [RedisService, RateLimiterService, SessionService],
})
export class RedisModule {}
