// src/modules/companies/services/departments.service.ts

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from '../entities/department.entity';
import { Branch } from '../entities/branch.entity';
import { CacheManagerService } from '@/config/redis/cache-manager.service';
import { Cacheable, CacheEvict } from '@/common/decorators/cache.decorator';
import { CACHE_PREFIXES, CACHE_PATTERNS, CACHE_CONFIG } from '@/common/constants/cache.constants';
import { CreateDepartmentDto } from '../dto/department/create-department.dto';
import { UpdateDepartmentDto } from '../dto/department/update-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    private readonly cacheManager: CacheManagerService,
  ) {}

  @CacheEvict([CACHE_PATTERNS.DEPARTMENTS.ALL, CACHE_PATTERNS.BRANCHES.ALL])
  async create(createDepartmentDto: CreateDepartmentDto, userId: string): Promise<Department> {
    // Verificar que existe la sucursal y está activa
    const branch = await this.branchRepository.findOne({
      where: { id: createDepartmentDto.branchId },
    });

    if (!branch) {
      throw new NotFoundException(`Branch with ID ${createDepartmentDto.branchId} not found`);
    }

    if (!branch.isActive) {
      throw new BadRequestException('Cannot create department for inactive branch');
    }

    // Verificar código único
    const existingDepartment = await this.departmentRepository.findOne({
      where: { code: createDepartmentDto.code },
    });

    if (existingDepartment) {
      throw new BadRequestException(
        `Department with code ${createDepartmentDto.code} already exists`,
      );
    }

    // Si tiene departamento padre, verificar que existe y es de la misma sucursal
    if (createDepartmentDto.parentId) {
      const parentDepartment = await this.departmentRepository.findOne({
        where: { id: createDepartmentDto.parentId },
      });

      if (!parentDepartment) {
        throw new NotFoundException(
          `Parent department with ID ${createDepartmentDto.parentId} not found`,
        );
      }

      if (parentDepartment.branchId !== createDepartmentDto.branchId) {
        throw new BadRequestException('Parent department must belong to the same branch');
      }

      if (!parentDepartment.isActive) {
        throw new BadRequestException('Cannot create department under inactive parent');
      }
    }

    const department = this.departmentRepository.create({
      ...createDepartmentDto,
      createdById: userId,
      updatedById: userId,
    });

    return this.departmentRepository.save(department);
  }

  @Cacheable({
    prefix: CACHE_PREFIXES.DEPARTMENTS,
    ttl: CACHE_CONFIG.DEPARTMENTS.DEFAULT_TTL,
  })
  async findAll(): Promise<Department[]> {
    return this.departmentRepository.find({
      relations: ['branch', 'parent', 'children', 'users', 'manager'],
      order: { createdAt: 'DESC' },
    });
  }

  @Cacheable({
    prefix: CACHE_PREFIXES.DEPARTMENTS,
    ttl: CACHE_CONFIG.DEPARTMENTS.DEFAULT_TTL,
    keyGenerator: (id: string) => CACHE_PATTERNS.DEPARTMENTS.SINGLE(id),
  })
  async findOne(id: string): Promise<Department> {
    const department = await this.departmentRepository.findOne({
      where: { id },
      relations: ['branch', 'parent', 'children', 'users', 'manager', 'createdBy', 'updatedBy'],
    });

    if (!department) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }

    return department;
  }

  @CacheEvict([CACHE_PATTERNS.DEPARTMENTS.ALL, CACHE_PATTERNS.BRANCHES.ALL])
  async update(
    id: string,
    updateDepartmentDto: UpdateDepartmentDto,
    userId: string,
  ): Promise<Department> {
    const department = await this.findOne(id);

    // Verificar código único si se está actualizando
    if (updateDepartmentDto.code && updateDepartmentDto.code !== department.code) {
      const existingDepartment = await this.departmentRepository.findOne({
        where: { code: updateDepartmentDto.code },
      });

      if (existingDepartment) {
        throw new BadRequestException(
          `Department with code ${updateDepartmentDto.code} already exists`,
        );
      }
    }

    // Si se está cambiando el padre, realizar validaciones
    if (updateDepartmentDto.parentId && updateDepartmentDto.parentId !== department.parentId) {
      const newParent = await this.departmentRepository.findOne({
        where: { id: updateDepartmentDto.parentId },
      });

      if (!newParent) {
        throw new NotFoundException(
          `Parent department with ID ${updateDepartmentDto.parentId} not found`,
        );
      }

      if (newParent.branchId !== department.branchId) {
        throw new BadRequestException('Parent department must belong to the same branch');
      }

      if (!newParent.isActive) {
        throw new BadRequestException('Cannot move department under inactive parent');
      }

      // Verificar que no cree ciclos en la jerarquía
      let currentParent = newParent;
      while (currentParent) {
        if (currentParent.id === id) {
          throw new BadRequestException('Cannot create circular reference in department hierarchy');
        }
        if (!currentParent.parentId) break;
        currentParent = await this.findOne(currentParent.parentId);
      }
    }

    Object.assign(department, {
      ...updateDepartmentDto,
      updatedById: userId,
    });

    return this.departmentRepository.save(department);
  }

  @CacheEvict([CACHE_PATTERNS.DEPARTMENTS.ALL, CACHE_PATTERNS.BRANCHES.ALL])
  async remove(id: string): Promise<void> {
    const department = await this.findOne(id);

    // Verificar si tiene departamentos hijos
    if (department.children && department.children.length > 0) {
      throw new BadRequestException('Cannot delete department with child departments');
    }

    // Verificar si tiene usuarios asignados
    if (department.users && department.users.length > 0) {
      throw new BadRequestException('Cannot delete department with assigned users');
    }

    await this.departmentRepository.remove(department);
  }

  @CacheEvict([CACHE_PATTERNS.DEPARTMENTS.ALL, CACHE_PATTERNS.BRANCHES.ALL])
  async toggleActive(id: string, userId: string): Promise<Department> {
    const department = await this.findOne(id);
    department.isActive = !department.isActive;
    department.updatedById = userId;

    // Si el departamento se desactiva
    if (!department.isActive) {
      // Verificar que no tenga departamentos hijos activos
      if (department.children?.some((child) => child.isActive)) {
        throw new BadRequestException('Cannot deactivate department with active child departments');
      }

      // Verificar que no tenga usuarios asignados activos
      if (department.users?.length > 0) {
        throw new BadRequestException('Cannot deactivate department with assigned users');
      }
    }

    return this.departmentRepository.save(department);
  }

  @Cacheable({
    prefix: CACHE_PREFIXES.DEPARTMENTS,
    ttl: CACHE_CONFIG.DEPARTMENTS.DEFAULT_TTL,
    keyGenerator: (branchId: string, filters?: any) =>
      `by-branch:${branchId}:${JSON.stringify(filters)}`,
  })
  async findByBranch(branchId: string, filters?: { isActive?: boolean }): Promise<Department[]> {
    const queryBuilder = this.departmentRepository
      .createQueryBuilder('department')
      .leftJoinAndSelect('department.parent', 'parent')
      .leftJoinAndSelect('department.children', 'children')
      .leftJoinAndSelect('department.users', 'users')
      .leftJoinAndSelect('department.manager', 'manager')
      .where('department.branchId = :branchId', { branchId });

    if (filters?.isActive !== undefined) {
      queryBuilder.andWhere('department.isActive = :isActive', { isActive: filters.isActive });
    }

    return queryBuilder
      .orderBy('department.parent', 'ASC')
      .addOrderBy('department.name', 'ASC')
      .getMany();
  }

  @Cacheable({
    prefix: CACHE_PREFIXES.DEPARTMENTS,
    ttl: CACHE_CONFIG.DEPARTMENTS.TREE_TTL,
    keyGenerator: (branchId: string, includeInactive?: boolean) =>
      `tree:${branchId}:${includeInactive ? 'all' : 'active'}`,
  })
  async getDepartmentTree(
    branchId: string,
    includeInactive: boolean = false,
  ): Promise<Department[]> {
    // Obtener todos los departamentos raíz (sin padre) de la sucursal
    const rootDepartments = await this.departmentRepository.find({
      where: {
        branchId,
        parentId: null,
        ...(includeInactive ? {} : { isActive: true }),
      },
      relations: ['children', 'users', 'manager'],
    });

    // Construir el árbol recursivamente
    return this.buildDepartmentTree(rootDepartments, includeInactive);
  }

  private async buildDepartmentTree(
    departments: Department[],
    includeInactive: boolean,
  ): Promise<Department[]> {
    const result = [];
    for (const department of departments) {
      if (!includeInactive && !department.isActive) {
        continue;
      }

      // Cargar los hijos del departamento actual
      department.children = await this.departmentRepository.find({
        where: { parentId: department.id },
        relations: ['children', 'users', 'manager'],
      });

      if (department.children?.length > 0) {
        department.children = await this.buildDepartmentTree(department.children, includeInactive);
      }

      result.push(department);
    }
    return result;
  }
}
