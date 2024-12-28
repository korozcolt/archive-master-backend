// src/modules/tags/tags.service.ts

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Tag } from './entities/tag.entity';
import { TagRelation, RelationType } from './entities/tag-relation.entity';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { CreateTagRelationDto } from './dto/create-tag-relation.dto';
import { CacheManagerService } from '@/config/redis/cache-manager.service';
import { Cacheable, CacheEvict } from '@/common/decorators/cache.decorator';
import { CACHE_PREFIXES, CACHE_PATTERNS, CACHE_CONFIG } from '@/common/constants/cache.constants';

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private tagRepository: Repository<Tag>,
    @InjectRepository(TagRelation)
    private tagRelationRepository: Repository<TagRelation>,
    private readonly cacheManager: CacheManagerService,
  ) {}

  @CacheEvict(CACHE_PATTERNS.TAGS.ALL)
  async create(createTagDto: CreateTagDto, userId: string): Promise<Tag> {
    const existingTag = await this.tagRepository.findOne({
      where: { name: createTagDto.name },
    });

    if (existingTag) {
      throw new BadRequestException('Tag with this name already exists');
    }

    if (createTagDto.parentId) {
      const parent = await this.tagRepository.findOne({
        where: { id: createTagDto.parentId },
      });
      if (!parent) {
        throw new BadRequestException('Parent tag not found');
      }
    }

    const tag = this.tagRepository.create({
      ...createTagDto,
      createdById: userId,
      updatedById: userId,
    });

    return this.tagRepository.save(tag);
  }

  @Cacheable({
    prefix: CACHE_PREFIXES.TAGS,
    ttl: CACHE_CONFIG.TAGS.DEFAULT_TTL,
  })
  async findAll(): Promise<Tag[]> {
    return this.tagRepository.find({
      relations: ['parent', 'children'],
      order: {
        name: 'ASC',
      },
    });
  }

  @Cacheable({
    prefix: CACHE_PREFIXES.TAGS,
    ttl: CACHE_CONFIG.TAGS.DEFAULT_TTL,
    keyGenerator: (id: string) => CACHE_PATTERNS.TAGS.SINGLE(id),
  })
  async findOne(id: string): Promise<Tag> {
    const tag = await this.tagRepository.findOne({
      where: { id },
      relations: [
        'parent',
        'children',
        'sourceRelations',
        'sourceRelations.relatedTag',
        'relatedRelations',
        'relatedRelations.sourceTag',
      ],
    });

    if (!tag) {
      throw new NotFoundException(`Tag with ID ${id} not found`);
    }

    return tag;
  }

  @CacheEvict(CACHE_PATTERNS.TAGS.ALL)
  async update(id: string, updateTagDto: UpdateTagDto, userId: string): Promise<Tag> {
    const tag = await this.findOne(id);

    if (updateTagDto.name) {
      const existingTag = await this.tagRepository.findOne({
        where: { name: updateTagDto.name, id: Not(id) },
      });

      if (existingTag) {
        throw new BadRequestException('Tag with this name already exists');
      }
    }

    if (updateTagDto.parentId) {
      if (updateTagDto.parentId === id) {
        throw new BadRequestException('A tag cannot be its own parent');
      }

      const parent = await this.findOne(updateTagDto.parentId);
      let currentParent = parent;
      while (currentParent?.parentId) {
        if (currentParent.parentId === id) {
          throw new BadRequestException('Cannot create circular reference in tag hierarchy');
        }
        currentParent = await this.findOne(currentParent.parentId);
      }
    }

    Object.assign(tag, {
      ...updateTagDto,
      updatedById: userId,
    });

    return this.tagRepository.save(tag);
  }

  @CacheEvict(CACHE_PATTERNS.TAGS.ALL)
  async remove(id: string): Promise<void> {
    const tag = await this.findOne(id);

    if (tag.children && tag.children.length > 0) {
      throw new BadRequestException('Cannot delete tag with children');
    }

    await this.tagRepository.remove(tag);
  }

  @Cacheable({
    prefix: CACHE_PREFIXES.TAGS,
    ttl: CACHE_CONFIG.TAGS.TREE_TTL,
    keyGenerator: () => CACHE_PATTERNS.TAGS.TREE,
  })
  async getTree(): Promise<Tag[]> {
    const tags = await this.tagRepository.find({
      relations: ['children'],
      where: { parentId: null },
      order: { name: 'ASC' },
    });

    return this.buildTree(tags);
  }

  private async buildTree(tags: Tag[]): Promise<Tag[]> {
    const result = [];
    for (const tag of tags) {
      if (tag.children) {
        tag.children = await this.buildTree(tag.children);
      }
      result.push(tag);
    }
    return result;
  }

  @CacheEvict(CACHE_PATTERNS.TAGS.ALL)
  async createRelation(
    createRelationDto: CreateTagRelationDto,
    userId: string,
  ): Promise<TagRelation> {
    const { sourceTagId, relatedTagId, relationType } = createRelationDto;

    if (sourceTagId === relatedTagId) {
      throw new BadRequestException('Cannot create relation with the same tag');
    }

    await this.findOne(sourceTagId);
    await this.findOne(relatedTagId);

    const existingRelation = await this.tagRelationRepository.findOne({
      where: [
        { sourceTagId, relatedTagId, relationType },
        ...(relationType === RelationType.SYNONYM
          ? [{ sourceTagId: relatedTagId, relatedTagId: sourceTagId, relationType }]
          : []),
      ],
    });

    if (existingRelation) {
      throw new BadRequestException('This relation already exists');
    }

    const relation = this.tagRelationRepository.create({
      sourceTagId,
      relatedTagId,
      relationType,
      createdById: userId,
    });

    const savedRelation = await this.tagRelationRepository.save(relation);

    if (relationType === RelationType.SYNONYM) {
      const inverseRelation = this.tagRelationRepository.create({
        sourceTagId: relatedTagId,
        relatedTagId: sourceTagId,
        relationType,
        createdById: userId,
      });
      await this.tagRelationRepository.save(inverseRelation);
    }

    return savedRelation;
  }

  @Cacheable({
    prefix: CACHE_PREFIXES.TAGS,
    ttl: CACHE_CONFIG.TAGS.RELATED_TTL,
    keyGenerator: (id: string) => CACHE_PATTERNS.TAGS.RELATED(id),
  })
  async findRelated(id: string): Promise<{ related: Tag[]; synonyms: Tag[] }> {
    const relations = await this.tagRelationRepository.find({
      where: [{ sourceTagId: id }, { relatedTagId: id }],
      relations: ['sourceTag', 'relatedTag'],
    });

    const related = [];
    const synonyms = [];

    for (const relation of relations) {
      const relatedTag = relation.sourceTagId === id ? relation.relatedTag : relation.sourceTag;
      if (relation.relationType === RelationType.SYNONYM) {
        synonyms.push(relatedTag);
      } else if (relation.relationType === RelationType.RELATED) {
        related.push(relatedTag);
      }
    }

    return { related, synonyms };
  }
}
