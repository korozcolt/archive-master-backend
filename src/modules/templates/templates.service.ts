// src/modules/templates/templates.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Template } from './entities/template.entity';
import { TemplateVersion } from './entities/template-version.entity';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { CreateTemplateVersionDto } from './dto/create-template-version.dto';
import { CACHE_CONFIG, CACHE_PATTERNS, CACHE_PREFIXES } from '@/common/constants/cache.constants';
import { Cacheable, CacheEvict } from '@/common/decorators/cache.decorator';
import { CacheManagerService } from '@/config/redis/cache-manager.service';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectRepository(Template)
    private templateRepository: Repository<Template>,
    @InjectRepository(TemplateVersion)
    private templateVersionRepository: Repository<TemplateVersion>,
    private readonly cacheManager: CacheManagerService,
  ) {}

  @CacheEvict(CACHE_PATTERNS.TEMPLATES.ALL)
  async create(createTemplateDto: CreateTemplateDto, userId: string): Promise<Template> {
    // Verificar si ya existe un template con el mismo código o nombre
    const existingTemplate = await this.templateRepository.findOne({
      where: [{ name: createTemplateDto.name }, { code: createTemplateDto.code }],
    });

    if (existingTemplate) {
      throw new BadRequestException('Template with this name or code already exists');
    }

    // Crear el template
    const template = this.templateRepository.create({
      ...createTemplateDto,
      createdById: userId,
      updatedById: userId,
    });

    const savedTemplate = await this.templateRepository.save(template);

    // Crear la primera versión
    await this.templateVersionRepository.save({
      templateId: savedTemplate.id,
      version: 1,
      metadataSchema: savedTemplate.metadataSchema,
      fieldsSchema: savedTemplate.fieldsSchema,
      validationRules: savedTemplate.validationRules,
      requiredFields: savedTemplate.requiredFields,
      defaultValues: savedTemplate.defaultValues,
      changeNotes: 'Initial version',
      createdById: userId,
    });

    return savedTemplate;
  }

  @Cacheable({
    prefix: CACHE_PREFIXES.TEMPLATES,
    ttl: CACHE_CONFIG.TEMPLATES.DEFAULT_TTL,
  })
  async findAll(): Promise<Template[]> {
    return this.templateRepository.find({
      relations: ['category', 'initialStatus'],
      order: {
        name: 'ASC',
      },
    });
  }

  @Cacheable({
    prefix: CACHE_PREFIXES.TEMPLATES,
    ttl: CACHE_CONFIG.TEMPLATES.DEFAULT_TTL,
    keyGenerator: (id: string) => CACHE_PATTERNS.TEMPLATES.SINGLE(id),
  })
  async findOne(id: string): Promise<Template> {
    const template = await this.templateRepository.findOne({
      where: { id },
      relations: ['category', 'initialStatus', 'versions'],
    });

    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }

    return template;
  }

  @CacheEvict(CACHE_PATTERNS.TEMPLATES.ALL)
  async update(
    id: string,
    updateTemplateDto: UpdateTemplateDto,
    userId: string,
  ): Promise<Template> {
    const template = await this.findOne(id);

    if (updateTemplateDto.name || updateTemplateDto.code) {
      const existingTemplate = await this.templateRepository.findOne({
        where: [
          updateTemplateDto.name
            ? {
                name: updateTemplateDto.name,
                id: Not(id),
              }
            : undefined,
          updateTemplateDto.code
            ? {
                code: updateTemplateDto.code,
                id: Not(id),
              }
            : undefined,
        ].filter(Boolean),
      });

      if (existingTemplate) {
        throw new BadRequestException('Template with this name or code already exists');
      }
    }

    // Si hay cambios en los esquemas o validaciones, crear una nueva versión
    if (
      updateTemplateDto.metadataSchema ||
      updateTemplateDto.fieldsSchema ||
      updateTemplateDto.validationRules ||
      updateTemplateDto.requiredFields ||
      updateTemplateDto.defaultValues
    ) {
      template.version += 1;
      await this.templateVersionRepository.save({
        templateId: template.id,
        version: template.version,
        metadataSchema: updateTemplateDto.metadataSchema || template.metadataSchema,
        fieldsSchema: updateTemplateDto.fieldsSchema || template.fieldsSchema,
        validationRules: updateTemplateDto.validationRules || template.validationRules,
        requiredFields: updateTemplateDto.requiredFields || template.requiredFields,
        defaultValues: updateTemplateDto.defaultValues || template.defaultValues,
        changeNotes: 'Updated version',
        createdById: userId,
      });
    }

    Object.assign(template, {
      ...updateTemplateDto,
      updatedById: userId,
    });

    return this.templateRepository.save(template);
  }

  @CacheEvict(CACHE_PATTERNS.TEMPLATES.ALL)
  async remove(id: string): Promise<void> {
    const template = await this.findOne(id);
    await this.templateRepository.remove(template);
  }

  @CacheEvict(CACHE_PATTERNS.TEMPLATES.ALL)
  async createVersion(
    templateId: string,
    createVersionDto: CreateTemplateVersionDto,
    userId: string,
  ): Promise<TemplateVersion> {
    const template = await this.findOne(templateId);

    // Incrementar la versión del template
    template.version += 1;
    await this.templateRepository.save(template);

    // Crear la nueva versión
    const version = this.templateVersionRepository.create({
      templateId: template.id,
      version: template.version,
      ...createVersionDto,
      createdById: userId,
    });

    return this.templateVersionRepository.save(version);
  }

  @Cacheable({
    prefix: CACHE_PREFIXES.TEMPLATES,
    ttl: CACHE_CONFIG.TEMPLATES.VERSIONS_TTL,
    keyGenerator: (templateId: string) => CACHE_PATTERNS.TEMPLATES.VERSIONS(templateId),
  })
  async findVersions(id: string): Promise<TemplateVersion[]> {
    const versions = await this.templateVersionRepository.find({
      where: { templateId: id },
      relations: ['createdBy'],
      order: { version: 'DESC' },
    });

    if (!versions.length) {
      throw new NotFoundException(`No versions found for template with ID ${id}`);
    }

    return versions;
  }

  async findVersion(id: string, version: number): Promise<TemplateVersion> {
    const templateVersion = await this.templateVersionRepository.findOne({
      where: { templateId: id, version },
      relations: ['createdBy'],
    });

    if (!templateVersion) {
      throw new NotFoundException(`Version ${version} not found for template with ID ${id}`);
    }

    return templateVersion;
  }

  async validateTemplateFields(templateId: string, fields: Record<string, any>): Promise<boolean> {
    const template = await this.findOne(templateId);

    // Verificar campos requeridos
    if (template.requiredFields) {
      for (const field of template.requiredFields) {
        if (!(field in fields)) {
          throw new BadRequestException(`Missing required field: ${field}`);
        }
      }
    }

    // Aquí podrías agregar más validaciones según el fieldsSchema
    // Por ejemplo, validar tipos de datos, rangos, etc.

    return true;
  }
}
