// src/modules/auth/auth.service.ts

import { CACHE_CONFIG, CACHE_PREFIXES } from '@/common/constants/cache.constants';
import { CacheEvict, Cacheable } from '@/common/decorators/cache.decorator';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';

import { CacheManagerService } from '@/config/redis/cache-manager.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { omit } from 'lodash';

interface JwtPayload {
  email: string;
  sub: string;
  role: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly cacheManager: CacheManagerService,
  ) {}

  @Cacheable({
    prefix: CACHE_PREFIXES.USERS,
    ttl: CACHE_CONFIG.USERS.DEFAULT_TTL,
    keyGenerator: (email: string) => `auth:validate:${email}`,
  })
  async validateUser(email: string, password: string): Promise<Partial<User> | null> {
    try {
      const user = await this.usersService.findByEmail(email);
      if (user && (await user.validatePassword(password))) {
        return omit(user, ['password']);
      }
      return null;
    } catch {
      this.logger.error('Error validating user');
      return null;
    }
  }

  async login(user: User) {
    try {
      const payload: JwtPayload = {
        email: user.email,
        sub: user.id,
        role: user.role?.name || 'user',
      };

      await this.usersService.updateLastLogin(user.id);
      const token = this.jwtService.sign(payload);

      await this.cacheManager.set(
        `auth:token:${user.id}`,
        {
          token,
          lastLogin: new Date(),
        },
        {
          prefix: CACHE_PREFIXES.USERS,
          ttl: CACHE_CONFIG.USERS.SESSIONS_TTL,
        },
      );

      return {
        access_token: token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      };
    } catch {
      this.logger.error('Error in login process');
      throw new UnauthorizedException('Error processing login');
    }
  }

  @CacheEvict([CACHE_PREFIXES.USERS])
  async logout(userId: string): Promise<void> {
    try {
      await Promise.all([
        this.cacheManager.delete(`auth:token:${userId}`, CACHE_PREFIXES.USERS),
        this.cacheManager.delete(`auth:validate:${userId}`, CACHE_PREFIXES.USERS),
      ]);
    } catch {
      this.logger.error('Error during logout');
    }
  }

  @Cacheable({
    prefix: CACHE_PREFIXES.USERS,
    ttl: CACHE_CONFIG.USERS.SESSIONS_TTL,
    keyGenerator: (token: string) => `auth:validate:token:${token}`,
  })
  async validateToken(token: string): Promise<JwtPayload> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(token);
      if (!payload) {
        throw new UnauthorizedException('Invalid token');
      }
      return payload;
    } catch {
      this.logger.error('Token validation failed');
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  @Cacheable({
    prefix: CACHE_PREFIXES.USERS,
    ttl: CACHE_CONFIG.USERS.ROLES_TTL,
    keyGenerator: (userId: string) => `auth:permissions:${userId}`,
  })
  async getUserPermissions(userId: string) {
    try {
      return await this.usersService.getUserPermissions(userId);
    } catch {
      this.logger.error('Error fetching permissions');
      throw new Error('Unable to retrieve user permissions');
    }
  }
}
