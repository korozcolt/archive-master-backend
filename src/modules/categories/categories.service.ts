// src/modules/categories/categories.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto, userId: string): Promise<Category> {
    const category = this.categoryRepository.create({
      ...createCategoryDto,
      createdById: userId,
      updatedById: userId,
    });

    if (createCategoryDto.parentId) {
      const parent = await this.categoryRepository.findOne({
        where: { id: createCategoryDto.parentId },
      });
      if (!parent) {
        throw new BadRequestException('Parent category not found');
      }
    }

    return this.categoryRepository.save(category);
  }

  async findAll(): Promise<Category[]> {
    return this.categoryRepository.find({
      relations: ['parent', 'children'],
      order: {
        order: 'ASC',
        createdAt: 'DESC',
      },
    });
  }

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

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
    userId: string,
  ): Promise<Category> {
    const category = await this.findOne(id);

    // Verificar que no se esté creando un ciclo en la jerarquía
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

  async remove(id: string): Promise<void> {
    const category = await this.findOne(id);

    // Verificar si tiene subcategorías
    if (category.children && category.children.length > 0) {
      throw new BadRequestException('Cannot delete category with subcategories');
    }

    await this.categoryRepository.remove(category);
  }

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

  async reorder(id: string, newOrder: number, userId: string): Promise<Category> {
    const category = await this.findOne(id);
    category.order = newOrder;
    category.updatedById = userId;
    return this.categoryRepository.save(category);
  }

  async toggleActive(id: string, userId: string): Promise<Category> {
    const category = await this.findOne(id);
    category.isActive = !category.isActive;
    category.updatedById = userId;
    return this.categoryRepository.save(category);
  }

  async validateMetadataSchema(schema: Record<string, any>): Promise<boolean> {
    // Aquí podrías implementar la validación del esquema JSON
    // Por ahora solo verificamos que sea un objeto válido
    try {
      JSON.stringify(schema);
      return true;
    } catch {
      throw new BadRequestException('Invalid metadata schema');
    }
  }
}
