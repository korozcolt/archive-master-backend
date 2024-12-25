// src/modules/configurations/configurations.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { ConfigurationGroup } from './entities/configuration-group.entity';
import { Configuration } from './entities/configuration.entity';
import { ConfigurationHistory } from './entities/configuration-history.entity';
import { CreateConfigurationGroupDto } from './dto/create-configuration-group.dto';
import { UpdateConfigurationGroupDto } from './dto/update-configuration-group.dto';
import { CreateConfigurationDto } from './dto/create-configuration.dto';
import { UpdateConfigurationDto } from './dto/update-configuration.dto';
import { BulkUpdateConfigurationsDto } from './dto/bulk-update-configurations.dto';

@Injectable()
export class ConfigurationsService {
  constructor(
    @InjectRepository(ConfigurationGroup)
    private groupRepository: Repository<ConfigurationGroup>,
    @InjectRepository(Configuration)
    private configRepository: Repository<Configuration>,
    @InjectRepository(ConfigurationHistory)
    private historyRepository: Repository<ConfigurationHistory>,
  ) {}

  // Métodos para grupos de configuración
  async createGroup(
    createGroupDto: CreateConfigurationGroupDto,
    userId: string,
  ): Promise<ConfigurationGroup> {
    const existingGroup = await this.groupRepository.findOne({
      where: [{ name: createGroupDto.name }, { code: createGroupDto.code }],
    });

    if (existingGroup) {
      throw new BadRequestException('Group with this name or code already exists');
    }

    const group = this.groupRepository.create({
      ...createGroupDto,
      createdById: userId,
      updatedById: userId,
    });

    return this.groupRepository.save(group);
  }

  async findAllGroups(): Promise<ConfigurationGroup[]> {
    return this.groupRepository.find({
      relations: ['configurations'],
      order: {
        order: 'ASC',
        name: 'ASC',
      },
    });
  }

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

  async updateGroup(
    id: string,
    updateGroupDto: UpdateConfigurationGroupDto,
    userId: string,
  ): Promise<ConfigurationGroup> {
    const group = await this.findOneGroup(id);

    if (updateGroupDto.name || updateGroupDto.code) {
      const existingGroup = await this.groupRepository.findOne({
        where: [
          updateGroupDto.name
            ? {
                name: updateGroupDto.name,
                id: Not(id),
              }
            : undefined,
          updateGroupDto.code
            ? {
                code: updateGroupDto.code,
                id: Not(id),
              }
            : undefined,
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

  async removeGroup(id: string): Promise<void> {
    const group = await this.findOneGroup(id);

    if (group.configurations?.some((config) => config.isSystem)) {
      throw new ForbiddenException('Cannot delete group containing system configurations');
    }

    await this.groupRepository.remove(group);
  }

  // Métodos para configuraciones
  async createConfiguration(
    createConfigDto: CreateConfigurationDto,
    userId: string,
  ): Promise<Configuration> {
    await this.findOneGroup(createConfigDto.groupId);

    const existingConfig = await this.configRepository.findOne({
      where: [
        { key: createConfigDto.key },
        { name: createConfigDto.name, groupId: createConfigDto.groupId },
      ],
    });

    if (existingConfig) {
      throw new BadRequestException('Configuration with this key or name already exists');
    }

    const config = this.configRepository.create({
      ...createConfigDto,
      createdById: userId,
      updatedById: userId,
    });

    return this.configRepository.save(config);
  }

  async findAllConfigurations(groupId?: string): Promise<Configuration[]> {
    const where = groupId ? { groupId } : {};
    return this.configRepository.find({
      where,
      relations: ['group'],
      order: {
        groupId: 'ASC',
        name: 'ASC',
      },
    });
  }

  async findPublicConfigurations(): Promise<Configuration[]> {
    return this.configRepository.find({
      where: { isPublic: true },
      select: ['id', 'key', 'value', 'type'],
    });
  }

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

  async updateConfiguration(
    id: string,
    updateConfigDto: UpdateConfigurationDto,
    userId: string,
  ): Promise<Configuration> {
    const config = await this.findOneConfiguration(id);

    if (config.isSystem && !updateConfigDto.value) {
      throw new ForbiddenException('Cannot modify system configuration properties');
    }

    const oldValue = config.value;

    if (updateConfigDto.key || updateConfigDto.name) {
      const existingConfig = await this.configRepository.findOne({
        where: [
          updateConfigDto.key
            ? {
                key: updateConfigDto.key,
                id: Not(id),
              }
            : undefined,
          updateConfigDto.name
            ? {
                name: updateConfigDto.name,
                groupId: config.groupId,
                id: Not(id),
              }
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

    // Registrar el cambio en el historial
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

  async removeConfiguration(id: string): Promise<void> {
    const config = await this.findOneConfiguration(id);

    if (config.isSystem) {
      throw new ForbiddenException('Cannot delete system configuration');
    }

    await this.configRepository.remove(config);
  }

  async bulkUpdate(
    bulkUpdateDto: BulkUpdateConfigurationsDto,
    userId: string,
  ): Promise<Configuration[]> {
    const results = [];

    for (const item of bulkUpdateDto.configurations) {
      const config = await this.updateConfiguration(
        item.id,
        {
          value: item.value,
          changeNotes: item.changeNotes,
        },
        userId,
      );
      results.push(config);
    }

    return results;
  }

  async getConfigurationHistory(id: string): Promise<ConfigurationHistory[]> {
    const config = await this.findOneConfiguration(id);
    return this.historyRepository.find({
      where: { configurationId: config.id },
      relations: ['createdBy'],
      order: { createdAt: 'DESC' },
    });
  }

  // Método utilitario para obtener valor de configuración por clave
  async getConfigurationValue<T>(key: string): Promise<T> {
    const config = await this.configRepository.findOne({
      where: { key },
    });

    if (!config) {
      throw new NotFoundException(`Configuration with key ${key} not found`);
    }

    return config.getValue();
  }
}
