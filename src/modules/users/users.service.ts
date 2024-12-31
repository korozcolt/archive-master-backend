// src/modules/users/users.service.ts

import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from '../roles/entities/role.entity';
import { CacheManagerService } from '@/config/redis/cache-manager.service';
import { Cacheable, CacheEvict } from '@/common/decorators/cache.decorator';
import { CACHE_PREFIXES, CACHE_PATTERNS, CACHE_CONFIG } from '@/common/constants/cache.constants';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
    private readonly cacheManager: CacheManagerService,
  ) {}

  @CacheEvict(CACHE_PATTERNS.USERS.ALL)
  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const user = this.usersRepository.create(createUserDto);

    if (createUserDto.roleId) {
      const role = await this.rolesRepository.findOne({
        where: { id: createUserDto.roleId },
      });
      if (!role) {
        throw new BadRequestException('Role not found');
      }
      user.role = role;
    }

    return this.usersRepository.save(user);
  }

  @Cacheable({
    prefix: CACHE_PREFIXES.USERS,
    ttl: CACHE_CONFIG.USERS.DEFAULT_TTL,
  })
  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  @Cacheable({
    prefix: CACHE_PREFIXES.USERS,
    ttl: CACHE_CONFIG.USERS.DEFAULT_TTL,
    keyGenerator: (id: string) => CACHE_PATTERNS.USERS.SINGLE(id),
  })
  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['role', 'department'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  @Cacheable({
    prefix: CACHE_PREFIXES.USERS,
    ttl: CACHE_CONFIG.USERS.DEFAULT_TTL,
    keyGenerator: (email: string) => `user:email:${email}`,
  })
  async findByEmail(email: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { email },
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    return user;
  }

  @CacheEvict([CACHE_PATTERNS.USERS.ALL])
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.usersRepository.findOne({
        where: { email: updateUserDto.email },
      });

      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
    }

    if (updateUserDto.roleId) {
      const role = await this.rolesRepository.findOne({
        where: { id: updateUserDto.roleId },
      });
      if (!role) {
        throw new BadRequestException('Role not found');
      }
      user.role = role;
      delete updateUserDto.roleId;
    }

    Object.assign(user, updateUserDto);
    return this.usersRepository.save(user);
  }

  @CacheEvict([CACHE_PATTERNS.USERS.ALL])
  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }

  @CacheEvict([CACHE_PATTERNS.USERS.ALL])
  async updateLastLogin(id: string): Promise<void> {
    await this.usersRepository.update(id, {
      lastLogin: new Date(),
    });
  }

  @Cacheable({
    prefix: CACHE_PREFIXES.USERS,
    ttl: CACHE_CONFIG.USERS.ROLES_TTL,
    keyGenerator: (roleId: string) => CACHE_PATTERNS.USERS.BY_ROLE(roleId),
  })
  async findByRole(roleId: string): Promise<User[]> {
    return this.usersRepository.find({
      where: { role: { id: roleId } },
      relations: ['role', 'department'],
    });
  }

  @Cacheable({
    prefix: CACHE_PREFIXES.USERS,
    ttl: CACHE_CONFIG.USERS.PERMISSIONS_TTL,
    keyGenerator: (userId: string) => CACHE_PATTERNS.USERS.PERMISSIONS(userId),
  })
  async getUserPermissions(userId: string): Promise<string[]> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['role', 'role.permissions'],
    });

    if (!user || !user.role) {
      return [];
    }

    return user.role.permissions.map((p) => p.name);
  }
}
