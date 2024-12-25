import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from './redis-cache.service';

@Injectable()
export class SessionService {
  constructor(
    private redisService: RedisService,
    private jwtService: JwtService,
  ) {}

  async createSession(userId: string, data: any): Promise<string> {
    const sessionToken = this.jwtService.sign({ userId });
    await this.redisService.set(`session:${userId}`, data, 24 * 60 * 60);
    return sessionToken;
  }

  async getSession(userId: string): Promise<any> {
    return await this.redisService.get(`session:${userId}`);
  }

  async invalidateSession(userId: string): Promise<void> {
    await this.redisService.del(`session:${userId}`);
  }
}
