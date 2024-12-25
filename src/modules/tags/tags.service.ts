// src/modules/tags/tags.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Tag } from './entities/tag.entity';
import { TagRelation, RelationType } from './entities/tag-relation.entity';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { CreateTagRelationDto } from './dto/create-tag-relation.dto';

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private tagRepository: Repository<Tag>,
    @InjectRepository(TagRelation)
    private tagRelationRepository: Repository<TagRelation>,
  ) {}

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

  async findAll(): Promise<Tag[]> {
    return this.tagRepository.find({
      relations: ['parent', 'children'],
      order: {
        name: 'ASC',
      },
    });
  }

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

  async update(id: string, updateTagDto: UpdateTagDto, userId: string): Promise<Tag> {
    const tag = await this.findOne(id);

    if (updateTagDto.name) {
      const existingTag = await this.tagRepository.findOne({
        where: {
          name: updateTagDto.name,
          id: Not(id),
        },
      });

      if (existingTag) {
        throw new BadRequestException('Tag with this name already exists');
      }
    }

    // Verificar ciclos en la jerarquía si se está actualizando el padre
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

  async remove(id: string): Promise<void> {
    const tag = await this.findOne(id);

    // Verificar si tiene hijos
    if (tag.children && tag.children.length > 0) {
      throw new BadRequestException('Cannot delete tag with children');
    }

    await this.tagRepository.remove(tag);
  }

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

  async createRelation(
    createRelationDto: CreateTagRelationDto,
    userId: string,
  ): Promise<TagRelation> {
    const { sourceTagId, relatedTagId, relationType } = createRelationDto;

    if (sourceTagId === relatedTagId) {
      throw new BadRequestException('Cannot create relation with the same tag');
    }

    // Verificar que ambos tags existen
    await this.findOne(sourceTagId);
    await this.findOne(relatedTagId);

    // Verificar si ya existe una relación similar
    const existingRelation = await this.tagRelationRepository.findOne({
      where: [
        {
          sourceTagId,
          relatedTagId,
          relationType,
        },
        ...(relationType === RelationType.SYNONYM
          ? [
              {
                sourceTagId: relatedTagId,
                relatedTagId: sourceTagId,
                relationType,
              },
            ]
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

    // Si es un sinónimo, crear la relación inversa
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

  async removeRelation(id: string): Promise<void> {
    const relation = await this.tagRelationRepository.findOne({
      where: { id },
    });

    if (!relation) {
      throw new NotFoundException(`Tag relation with ID ${id} not found`);
    }

    // Si es un sinónimo, eliminar también la relación inversa
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
