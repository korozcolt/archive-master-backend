// src/modules/categories/categories.service.ts

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CacheManagerService } from '@/config/redis/cache-manager.service';
import { Cacheable, CacheEvict } from '@/common/decorators/cache.decorator';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly cacheManager: CacheManagerService,
  ) {}

  @CacheEvict('categories:*')
  async create(createCategoryDto: CreateCategoryDto, userId: string): Promise<Category> {
    const existingCategory = await this.categoryRepository.findOne({
      where: { name: createCategoryDto.name },
    });

    if (existingCategory) {
      throw new BadRequestException('Category with this name already exists');
    }

    if (createCategoryDto.parentId) {
      const parent = await this.categoryRepository.findOne({
        where: { id: createCategoryDto.parentId },
      });
      if (!parent) {
        throw new BadRequestException('Parent category not found');
      }
    }

    const category = this.categoryRepository.create({
      ...createCategoryDto,
      createdById: userId,
      updatedById: userId,
    });

    return this.categoryRepository.save(category);
  }

  @Cacheable({
    prefix: 'categories',
    ttl: 3600, // 1 hora
  })
  async findAll(): Promise<Category[]> {
    return this.categoryRepository.find({
      relations: ['parent', 'children'],
      order: {
        order: 'ASC',
        createdAt: 'DESC',
      },
    });
  }

  @Cacheable({
    prefix: 'categories',
    ttl: 3600,
    keyGenerator: (id: string) => `category:${id}`,
  })
  async findOne(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['parent', 'children', 'createdBy', 'updatedBy'],
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  @CacheEvict('categories:*')
  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
    userId: string,
  ): Promise<Category> {
    const category = await this.findOne(id);

    if (updateCategoryDto.parentId) {
      const parent = await this.findOne(updateCategoryDto.parentId);
      let currentParent = parent;
      while (currentParent) {
        if (currentParent.id === id) {
          throw new BadRequestException('Cannot create circular reference in category hierarchy');
        }
        if (!currentParent.parentId) break;
        currentParent = await this.findOne(currentParent.parentId);
      }
    }

    Object.assign(category, {
      ...updateCategoryDto,
      updatedById: userId,
    });

    return this.categoryRepository.save(category);
  }

  @CacheEvict('categories:*')
  async remove(id: string): Promise<void> {
    const category = await this.findOne(id);

    if (category.children && category.children.length > 0) {
      throw new BadRequestException('Cannot delete category with subcategories');
    }

    await this.categoryRepository.remove(category);
  }

  @Cacheable({
    prefix: 'categories',
    ttl: 3600,
    keyGenerator: () => 'tree',
  })
  async getTree(): Promise<Category[]> {
    const categories = await this.categoryRepository.find({
      relations: ['children'],
      where: { parentId: null },
      order: { order: 'ASC' },
    });

    return this.buildTree(categories);
  }

  private async buildTree(categories: Category[]): Promise<Category[]> {
    const result = [];
    for (const category of categories) {
      if (category.children) {
        category.children = await this.buildTree(category.children);
      }
      result.push(category);
    }
    return result;
  }

  @CacheEvict('categories:*')
  async reorder(id: string, newOrder: number, userId: string): Promise<Category> {
    const category = await this.findOne(id);
    category.order = newOrder;
    category.updatedById = userId;
    return this.categoryRepository.save(category);
  }

  @CacheEvict('categories:*')
  async toggleActive(id: string, userId: string): Promise<Category> {
    const category = await this.findOne(id);
    category.isActive = !category.isActive;
    category.updatedById = userId;
    return this.categoryRepository.save(category);
  }

  async validateMetadataSchema(schema: Record<string, any>): Promise<boolean> {
    try {
      JSON.stringify(schema);
      return true;
    } catch {
      throw new BadRequestException('Invalid metadata schema');
    }
  }
}
