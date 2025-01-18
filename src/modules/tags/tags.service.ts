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
import { CACHE_PREFIXES, CACHE_CONFIG } from '@/common/constants/cache.constants';

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private tagRepository: Repository<Tag>,
    @InjectRepository(TagRelation)
    private tagRelationRepository: Repository<TagRelation>,
    private readonly cacheManager: CacheManagerService,
  ) {}

  @CacheEvict(['tags:*', 'tags:tree:*'])
  async create(createTagDto: CreateTagDto, userId: string): Promise<Tag> {
    const existingTag = await this.tagRepository.findOne({
      where: [{ name: createTagDto.name }, { slug: this.generateSlug(createTagDto.name) }],
    });

    if (existingTag) {
      throw new BadRequestException(
        `Tag with name "${createTagDto.name}" or similar slug already exists`,
      );
    }

    if (createTagDto.parentId) {
      const parent = await this.findOne(createTagDto.parentId);
      if (!parent.isActive) {
        throw new BadRequestException('Cannot create tag under inactive parent');
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
    keyGenerator: (filter?: { isActive?: boolean }) => `all:${filter?.isActive ?? 'all'}`,
  })
  async findAll(filter?: { isActive?: boolean }): Promise<Tag[]> {
    const queryBuilder = this.tagRepository
      .createQueryBuilder('tag')
      .leftJoinAndSelect('tag.parent', 'parent')
      .leftJoinAndSelect('tag.children', 'children');

    if (filter?.isActive !== undefined) {
      queryBuilder.where('tag.isActive = :isActive', { isActive: filter.isActive });
    }

    return queryBuilder.orderBy('tag.order', 'ASC').addOrderBy('tag.name', 'ASC').getMany();
  }

  @Cacheable({
    prefix: CACHE_PREFIXES.TAGS,
    ttl: CACHE_CONFIG.TAGS.DEFAULT_TTL,
    keyGenerator: (id: string) => `tag:${id}`,
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

  @Cacheable({
    prefix: CACHE_PREFIXES.TAGS,
    ttl: CACHE_CONFIG.TAGS.DEFAULT_TTL,
    keyGenerator: (slug: string) => `slug:${slug}`,
  })
  async findBySlug(slug: string): Promise<Tag> {
    const tag = await this.tagRepository.findOne({
      where: { slug },
      relations: ['parent', 'children'],
    });

    if (!tag) {
      throw new NotFoundException(`Tag with slug "${slug}" not found`);
    }

    return tag;
  }

  @CacheEvict(['tags:*', 'tags:tree:*', `tags:tag:*`])
  async update(id: string, updateTagDto: UpdateTagDto, userId: string): Promise<Tag> {
    const tag = await this.findOne(id);

    if (updateTagDto.name) {
      const slug = this.generateSlug(updateTagDto.name);
      const existingTag = await this.tagRepository.findOne({
        where: [
          { name: updateTagDto.name, id: Not(id) },
          { slug, id: Not(id) },
        ],
      });

      if (existingTag) {
        throw new BadRequestException(
          `Tag with name "${updateTagDto.name}" or similar slug already exists`,
        );
      }
    }

    if (updateTagDto.parentId !== undefined) {
      if (updateTagDto.parentId === id) {
        throw new BadRequestException('A tag cannot be its own parent');
      }

      if (updateTagDto.parentId) {
        const parent = await this.findOne(updateTagDto.parentId);
        if (!parent.isActive) {
          throw new BadRequestException('Cannot move tag under inactive parent');
        }

        let currentParent = parent;
        while (currentParent?.parentId) {
          if (currentParent.parentId === id) {
            throw new BadRequestException('Cannot create circular reference in tag hierarchy');
          }
          currentParent = await this.findOne(currentParent.parentId);
        }
      }
    }

    Object.assign(tag, {
      ...updateTagDto,
      updatedById: userId,
    });

    return this.tagRepository.save(tag);
  }

  @CacheEvict(['tags:*', 'tags:tree:*', 'tags:related:*'])
  async remove(id: string): Promise<void> {
    const tag = await this.findOne(id);

    if (tag.children && tag.children.length > 0) {
      throw new BadRequestException('Cannot delete tag with children');
    }

    const hasRelations = await this.tagRelationRepository.count({
      where: [{ sourceTagId: id }, { relatedTagId: id }],
    });

    if (hasRelations > 0) {
      throw new BadRequestException('Cannot delete tag with existing relations');
    }

    await this.tagRepository.remove(tag);
  }

  @Cacheable({
    prefix: CACHE_PREFIXES.TAGS,
    ttl: CACHE_CONFIG.TAGS.TREE_TTL,
    keyGenerator: (includeInactive?: boolean) => `tree:${includeInactive ? 'all' : 'active'}`,
  })
  async getTree(includeInactive: boolean = false): Promise<Tag[]> {
    const queryBuilder = this.tagRepository
      .createQueryBuilder('tag')
      .leftJoinAndSelect('tag.children', 'children')
      .where('tag.parentId IS NULL')
      .orderBy('tag.order', 'ASC')
      .addOrderBy('tag.name', 'ASC');

    if (!includeInactive) {
      queryBuilder.andWhere('tag.isActive = :isActive', { isActive: true });
    }

    const tags = await queryBuilder.getMany();
    return this.buildTree(tags, includeInactive);
  }

  private async buildTree(tags: Tag[], includeInactive: boolean): Promise<Tag[]> {
    const result = [];
    for (const tag of tags) {
      if (!includeInactive && !tag.isActive) {
        continue;
      }

      if (tag.children) {
        tag.children = await this.buildTree(tag.children, includeInactive);
      }
      result.push(tag);
    }
    return result;
  }

  @CacheEvict(['tags:*', 'tags:related:*'])
  async createRelation(
    createRelationDto: CreateTagRelationDto,
    userId: string,
  ): Promise<TagRelation> {
    const { sourceTagId, relatedTagId, relationType } = createRelationDto;

    if (sourceTagId === relatedTagId) {
      throw new BadRequestException('Cannot create relation with the same tag');
    }

    const sourceTag = await this.findOne(sourceTagId);
    const relatedTag = await this.findOne(relatedTagId);

    if (!sourceTag.isActive || !relatedTag.isActive) {
      throw new BadRequestException('Cannot create relations with inactive tags');
    }

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
    keyGenerator: (id: string, includeInactive?: boolean) =>
      `related:${id}:${includeInactive ? 'all' : 'active'}`,
  })
  async findRelated(
    id: string,
    includeInactive: boolean = false,
  ): Promise<{ related: Tag[]; synonyms: Tag[] }> {
    const queryBuilder = this.tagRelationRepository
      .createQueryBuilder('relation')
      .leftJoinAndSelect('relation.sourceTag', 'sourceTag')
      .leftJoinAndSelect('relation.relatedTag', 'relatedTag')
      .where([{ sourceTagId: id }, { relatedTagId: id }]);

    if (!includeInactive) {
      queryBuilder
        .andWhere('sourceTag.isActive = :isActive', { isActive: true })
        .andWhere('relatedTag.isActive = :isActive', { isActive: true });
    }

    const relations = await queryBuilder.getMany();

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

  @CacheEvict(['tags:related:*'])
  async removeRelation(id: string): Promise<void> {
    const relation = await this.tagRelationRepository.findOne({
      where: { id },
    });

    if (!relation) {
      throw new NotFoundException(`Tag relation with ID ${id} not found`);
    }

    if (relation.relationType === RelationType.SYNONYM) {
      const inverseRelation = await this.tagRelationRepository.findOne({
        where: {
          sourceTagId: relation.relatedTagId,
          relatedTagId: relation.sourceTagId,
          relationType: RelationType.SYNONYM,
        },
      });
      if (inverseRelation) {
        await this.tagRelationRepository.remove(inverseRelation);
      }
    }

    await this.tagRelationRepository.remove(relation);
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }
}
