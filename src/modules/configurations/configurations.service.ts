// src/modules/configurations/configurations.service.ts

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { ConfigurationGroup } from './entities/configuration-group.entity';
import { Configuration } from './entities/configuration.entity';
import { ConfigurationHistory } from './entities/configuration-history.entity';
import { CreateConfigurationGroupDto } from './dto/create-configuration-group.dto';
import { UpdateConfigurationDto } from './dto/update-configuration.dto';
import { BulkUpdateConfigurationsDto } from './dto/bulk-update-configurations.dto';
import { CacheManagerService } from '@/config/redis/cache-manager.service';
import { Cacheable, CacheEvict } from '@/common/decorators/cache.decorator';
import { CACHE_PREFIXES, CACHE_PATTERNS, CACHE_CONFIG } from '@/common/constants/cache.constants';
import { CreateConfigurationDto } from './dto/create-configuration.dto';
import { UpdateConfigurationGroupDto } from './dto/update-configuration-group.dto';

@Injectable()
export class ConfigurationsService {
  constructor(
    @InjectRepository(ConfigurationGroup)
    private groupRepository: Repository<ConfigurationGroup>,
    @InjectRepository(Configuration)
    private configRepository: Repository<Configuration>,
    @InjectRepository(ConfigurationHistory)
    private historyRepository: Repository<ConfigurationHistory>,
    private readonly cacheManager: CacheManagerService,
  ) {}

  @CacheEvict(CACHE_PATTERNS.CONFIGURATIONS.ALL)
  async createGroup(
    createGroupDto: CreateConfigurationGroupDto,
    userId: string,
  ): Promise<ConfigurationGroup> {
    const existingGroup = await this.groupRepository.findOne({
      where: [{ name: createGroupDto.name }, { code: createGroupDto.code }],
    });

    if (existingGroup) {
      throw new BadRequestException(
        `Group with name "${createGroupDto.name}" or code "${createGroupDto.code}" already exists`,
      );
    }

    const group = this.groupRepository.create({
      ...createGroupDto,
      createdById: userId,
      updatedById: userId,
    });

    return this.groupRepository.save(group);
  }

  @CacheEvict(CACHE_PATTERNS.CONFIGURATIONS.ALL)
  async updateGroup(
    id: string,
    updateGroupDto: UpdateConfigurationGroupDto,
    userId: string,
  ): Promise<ConfigurationGroup> {
    const group = await this.findOneGroup(id);

    if (updateGroupDto.name || updateGroupDto.code) {
      const existingGroup = await this.groupRepository.findOne({
        where: [
          updateGroupDto.name ? { name: updateGroupDto.name, id: Not(id) } : undefined,
          updateGroupDto.code ? { code: updateGroupDto.code, id: Not(id) } : undefined,
        ].filter(Boolean),
      });

      if (existingGroup) {
        throw new BadRequestException('Group with this name or code already exists');
      }
    }

    Object.assign(group, {
      ...updateGroupDto,
      updatedById: userId,
    });

    return this.groupRepository.save(group);
  }

  @CacheEvict(CACHE_PATTERNS.CONFIGURATIONS.ALL)
  async removeGroup(id: string): Promise<void> {
    const group = await this.findOneGroup(id);

    const hasConfigurations = await this.configRepository.count({
      where: { groupId: id },
    });

    if (hasConfigurations > 0) {
      throw new BadRequestException('Cannot delete group with existing configurations');
    }

    await this.groupRepository.remove(group);
  }

  @Cacheable({
    prefix: CACHE_PREFIXES.CONFIGURATIONS,
    ttl: CACHE_CONFIG.CONFIGURATIONS.GROUPS_TTL,
    keyGenerator: () => CACHE_PATTERNS.CONFIGURATIONS.GROUPS,
  })
  async findAllGroups(): Promise<ConfigurationGroup[]> {
    return this.groupRepository.find({
      relations: ['configurations'],
      order: { order: 'ASC', name: 'ASC' },
    });
  }

  @Cacheable({
    prefix: CACHE_PREFIXES.CONFIGURATIONS,
    ttl: CACHE_CONFIG.CONFIGURATIONS.GROUPS_TTL,
    keyGenerator: (id: string) => CACHE_PATTERNS.CONFIGURATIONS.GROUP(id),
  })
  async findOneGroup(id: string): Promise<ConfigurationGroup> {
    const group = await this.groupRepository.findOne({
      where: { id },
      relations: ['configurations'],
    });

    if (!group) {
      throw new NotFoundException(`Configuration group with ID ${id} not found`);
    }

    return group;
  }

  @Cacheable({
    prefix: CACHE_PREFIXES.CONFIGURATIONS,
    ttl: CACHE_CONFIG.CONFIGURATIONS.PUBLIC_TTL,
    keyGenerator: () => CACHE_PATTERNS.CONFIGURATIONS.PUBLIC,
  })
  async findPublicConfigurations(): Promise<Configuration[]> {
    return this.configRepository.find({
      where: { isPublic: true },
      select: ['id', 'key', 'value', 'type'],
    });
  }

  @Cacheable({
    prefix: CACHE_PREFIXES.CONFIGURATIONS,
    ttl: CACHE_CONFIG.CONFIGURATIONS.DEFAULT_TTL,
    keyGenerator: (key: string) => `value:${key}`,
  })
  async getConfigurationValue<T>(key: string): Promise<T> {
    const config = await this.configRepository.findOne({
      where: { key },
    });

    if (!config) {
      throw new NotFoundException(`Configuration with key "${key}" not found`);
    }

    return config.getValue();
  }

  @Cacheable({
    prefix: CACHE_PREFIXES.CONFIGURATIONS,
    ttl: CACHE_CONFIG.CONFIGURATIONS.DEFAULT_TTL,
    keyGenerator: (id: string) => CACHE_PATTERNS.CONFIGURATIONS.SINGLE(id),
  })
  async findOneConfiguration(id: string): Promise<Configuration> {
    const config = await this.configRepository.findOne({
      where: { id },
      relations: ['group', 'history'],
    });

    if (!config) {
      throw new NotFoundException(`Configuration with ID ${id} not found`);
    }

    return config;
  }

  @CacheEvict(CACHE_PATTERNS.CONFIGURATIONS.ALL)
  async createConfiguration(
    createConfigDto: CreateConfigurationDto,
    userId: string,
  ): Promise<Configuration> {
    // Verificar que el grupo existe
    await this.findOneGroup(createConfigDto.groupId);

    const existingConfig = await this.configRepository.findOne({
      where: [
        { key: createConfigDto.key },
        { name: createConfigDto.name, groupId: createConfigDto.groupId },
      ],
    });

    if (existingConfig) {
      throw new BadRequestException(
        existingConfig.key === createConfigDto.key
          ? `Configuration with key "${createConfigDto.key}" already exists`
          : `Configuration with name "${createConfigDto.name}" already exists in the specified group`,
      );
    }

    const config = this.configRepository.create({
      ...createConfigDto,
      createdById: userId,
      updatedById: userId,
    });

    return this.configRepository.save(config);
  }

  @CacheEvict(CACHE_PATTERNS.CONFIGURATIONS.ALL)
  async updateConfiguration(
    id: string,
    updateConfigDto: UpdateConfigurationDto,
    userId: string,
  ): Promise<Configuration> {
    const config = await this.findOneConfiguration(id);
    const oldValue = config.value;

    if (config.isSystem && !updateConfigDto.value) {
      throw new BadRequestException('Cannot modify system configuration properties');
    }

    if (updateConfigDto.key || updateConfigDto.name) {
      const existingConfig = await this.configRepository.findOne({
        where: [
          updateConfigDto.key ? { key: updateConfigDto.key, id: Not(id) } : undefined,
          updateConfigDto.name
            ? { name: updateConfigDto.name, groupId: config.groupId, id: Not(id) }
            : undefined,
        ].filter(Boolean),
      });

      if (existingConfig) {
        throw new BadRequestException('Configuration with this key or name already exists');
      }
    }

    Object.assign(config, {
      ...updateConfigDto,
      updatedById: userId,
    });

    const savedConfig = await this.configRepository.save(config);

    if (oldValue !== config.value) {
      await this.historyRepository.save({
        configurationId: config.id,
        oldValue,
        newValue: config.value,
        changeNotes: updateConfigDto.changeNotes,
        createdById: userId,
      });
    }

    return savedConfig;
  }

  @CacheEvict(CACHE_PATTERNS.CONFIGURATIONS.ALL)
  async removeConfiguration(id: string): Promise<void> {
    const config = await this.findOneConfiguration(id);

    if (config.isSystem) {
      throw new BadRequestException('Cannot delete system configuration');
    }

    await this.configRepository.remove(config);
  }

  @Cacheable({
    prefix: CACHE_PREFIXES.CONFIGURATIONS,
    ttl: CACHE_CONFIG.CONFIGURATIONS.DEFAULT_TTL,
    keyGenerator: (groupId?: string) =>
      groupId ? CACHE_PATTERNS.CONFIGURATIONS.GROUP(groupId) : 'all',
  })
  async findAllConfigurations(groupId?: string): Promise<Configuration[]> {
    const queryBuilder = this.configRepository
      .createQueryBuilder('config')
      .leftJoinAndSelect('config.group', 'group');

    if (groupId) {
      queryBuilder.where('config.groupId = :groupId', { groupId });
    }

    return queryBuilder.orderBy('config.groupId', 'ASC').addOrderBy('config.name', 'ASC').getMany();
  }

  async getConfigurationHistory(id: string): Promise<ConfigurationHistory[]> {
    await this.findOneConfiguration(id); // Verifica que la configuración existe

    return this.historyRepository.find({
      where: { configurationId: id },
      relations: ['createdBy'],
      order: { createdAt: 'DESC' },
    });
  }

  @CacheEvict(CACHE_PATTERNS.CONFIGURATIONS.ALL)
  async bulkUpdate(
    bulkUpdateDto: BulkUpdateConfigurationsDto,
    userId: string,
  ): Promise<Configuration[]> {
    const results = [];
    for (const item of bulkUpdateDto.configurations) {
      const config = await this.updateConfiguration(
        item.id,
        { value: item.value, changeNotes: item.changeNotes },
        userId,
      );
      results.push(config);
    }
    return results;
  }
}
