// src/modules/status/status.service.ts

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Status } from './entities/status.entity';
import { StatusTransition } from './entities/status-transition.entity';
import { CreateStatusDto } from './dto/create-status.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { CreateStatusTransitionDto } from './dto/create-status-transition.dto';
import { UpdateStatusTransitionDto } from './dto/update-status-transition.dto';
import { CacheManagerService } from '@/config/redis/cache-manager.service';
import { Cacheable, CacheEvict } from '@/common/decorators/cache.decorator';
import { CACHE_PREFIXES, CACHE_PATTERNS, CACHE_CONFIG } from '@/common/constants/cache.constants';
import { Role } from '../roles/entities/role.entity';

@Injectable()
export class StatusService {
  constructor(
    @InjectRepository(Status)
    private statusRepository: Repository<Status>,
    @InjectRepository(StatusTransition)
    private transitionRepository: Repository<StatusTransition>,
    private readonly cacheManager: CacheManagerService,
  ) {}

  @CacheEvict(CACHE_PATTERNS.STATUS.ALL)
  async createStatus(createStatusDto: CreateStatusDto, userId: string): Promise<Status> {
    const existingStatus = await this.statusRepository.findOne({
      where: [{ code: createStatusDto.code }, { name: createStatusDto.name }],
    });

    if (existingStatus) {
      throw new BadRequestException('Status with this code or name already exists');
    }

    const status = this.statusRepository.create({
      ...createStatusDto,
      createdById: userId,
      updatedById: userId,
    });

    return this.statusRepository.save(status);
  }

  @Cacheable({
    prefix: CACHE_PREFIXES.STATUS,
    ttl: CACHE_CONFIG.STATUS.DEFAULT_TTL,
  })
  async findAllStatus(): Promise<Status[]> {
    return this.statusRepository.find({
      relations: ['transitionsFrom', 'transitionsTo'],
      order: {
        createdAt: 'ASC',
      },
    });
  }

  @Cacheable({
    prefix: CACHE_PREFIXES.STATUS,
    ttl: CACHE_CONFIG.STATUS.DEFAULT_TTL,
    keyGenerator: (id: string) => CACHE_PATTERNS.STATUS.SINGLE(id),
  })
  async findOneStatus(id: string): Promise<Status> {
    const status = await this.statusRepository.findOne({
      where: { id },
      relations: ['transitionsFrom', 'transitionsTo'],
    });

    if (!status) {
      throw new NotFoundException(`Status with ID ${id} not found`);
    }

    return status;
  }

  @CacheEvict(CACHE_PATTERNS.STATUS.ALL)
  async updateStatus(
    id: string,
    updateStatusDto: UpdateStatusDto,
    userId: string,
  ): Promise<Status> {
    const status = await this.findOneStatus(id);
    Object.assign(status, {
      ...updateStatusDto,
      updatedById: userId,
    });

    return this.statusRepository.save(status);
  }

  @CacheEvict(CACHE_PATTERNS.STATUS.ALL)
  async removeStatus(id: string): Promise<void> {
    const status = await this.findOneStatus(id);

    const hasTransitions = await this.transitionRepository.findOne({
      where: [{ fromStatusId: id }, { toStatusId: id }],
    });

    if (hasTransitions) {
      throw new BadRequestException('Cannot delete status that is used in transitions');
    }

    await this.statusRepository.remove(status);
  }

  @CacheEvict(CACHE_PATTERNS.STATUS.TRANSITIONS)
  async createTransition(
    createTransitionDto: CreateStatusTransitionDto,
    userId: string,
  ): Promise<StatusTransition> {
    if (createTransitionDto.fromStatusId) {
      await this.findOneStatus(createTransitionDto.fromStatusId);
    }
    await this.findOneStatus(createTransitionDto.toStatusId);

    const existingTransition = await this.transitionRepository.findOne({
      where: {
        fromStatusId: createTransitionDto.fromStatusId,
        toStatusId: createTransitionDto.toStatusId,
      },
    });

    if (existingTransition) {
      throw new BadRequestException('This transition already exists');
    }

    const transition = this.transitionRepository.create({
      ...createTransitionDto,
      createdById: userId,
      updatedById: userId,
    });

    return this.transitionRepository.save(transition);
  }

  @Cacheable({
    prefix: CACHE_PREFIXES.STATUS,
    ttl: CACHE_CONFIG.STATUS.TRANSITIONS_TTL,
  })
  async findAllTransitions(): Promise<StatusTransition[]> {
    return this.transitionRepository.find({
      relations: ['fromStatus', 'toStatus', 'requiredRole'],
    });
  }

  @CacheEvict(CACHE_PATTERNS.STATUS.TRANSITIONS)
  async updateTransition(
    id: string,
    updateTransitionDto: UpdateStatusTransitionDto,
    userId: string,
  ): Promise<StatusTransition> {
    const transition = await this.findOneTransition(id);

    if (updateTransitionDto.fromStatusId) {
      await this.findOneStatus(updateTransitionDto.fromStatusId);
    }
    if (updateTransitionDto.toStatusId) {
      await this.findOneStatus(updateTransitionDto.toStatusId);
    }

    Object.assign(transition, {
      ...updateTransitionDto,
      updatedById: userId,
    });

    return this.transitionRepository.save(transition);
  }

  @Cacheable({
    prefix: CACHE_PREFIXES.STATUS,
    ttl: CACHE_CONFIG.STATUS.TRANSITIONS_TTL,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    keyGenerator: (statusId: string, role: Role) => CACHE_PATTERNS.STATUS.AVAILABLE(statusId),
  })
  async getAvailableTransitions(
    currentStatusId: string | null,
    role: Role,
  ): Promise<StatusTransition[]> {
    const transitions = await this.transitionRepository.find({
      where: {
        fromStatusId: currentStatusId || null,
        isActive: true,
      },
      relations: ['toStatus', 'requiredRole'],
    });

    return transitions.filter(
      (transition) => !transition.requiredRole || transition.requiredRole.id === role.id,
    );
  }

  @CacheEvict(CACHE_PATTERNS.STATUS.TRANSITIONS)
  async removeTransition(id: string): Promise<void> {
    const transition = await this.findOneTransition(id);
    await this.transitionRepository.remove(transition);
  }

  public async findOneTransition(id: string): Promise<StatusTransition> {
    const transition = await this.transitionRepository.findOne({
      where: { id },
      relations: ['fromStatus', 'toStatus', 'requiredRole'],
    });

    if (!transition) {
      throw new NotFoundException(`Status transition with ID ${id} not found`);
    }

    return transition;
  }
}
