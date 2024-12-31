// src/modules/companies/services/branches.service.ts

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Branch } from '../entities/branch.entity';
import { Company } from '../entities/company.entity';
import { CacheManagerService } from '@/config/redis/cache-manager.service';
import { Cacheable, CacheEvict } from '@/common/decorators/cache.decorator';
import { CACHE_PREFIXES, CACHE_PATTERNS, CACHE_CONFIG } from '@/common/constants/cache.constants';
import { CreateBranchDto } from '../dto/branch/create-branch.dto';
import { UpdateBranchDto } from '../dto/branch/update-branch.dto';

@Injectable()
export class BranchesService {
  constructor(
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    private readonly cacheManager: CacheManagerService,
  ) {}

  @CacheEvict([CACHE_PATTERNS.BRANCHES.ALL, CACHE_PATTERNS.COMPANIES.ALL])
  async create(createBranchDto: CreateBranchDto, userId: string): Promise<Branch> {
    // Verificar que existe la compañía y está activa
    const company = await this.companyRepository.findOne({
      where: { id: createBranchDto.companyId },
    });

    if (!company) {
      throw new NotFoundException(`Company with ID ${createBranchDto.companyId} not found`);
    }

    if (!company.isActive) {
      throw new BadRequestException('Cannot create branch for inactive company');
    }

    // Verificar código único
    const existingBranch = await this.branchRepository.findOne({
      where: { code: createBranchDto.code },
    });

    if (existingBranch) {
      throw new BadRequestException(`Branch with code ${createBranchDto.code} already exists`);
    }

    // Si es sucursal principal, verificar que no exista otra principal
    if (createBranchDto.isMain) {
      const existingMainBranch = await this.branchRepository.findOne({
        where: { companyId: createBranchDto.companyId, isMain: true },
      });

      if (existingMainBranch) {
        throw new BadRequestException('Company already has a main branch');
      }
    }

    const branch = this.branchRepository.create({
      ...createBranchDto,
      createdById: userId,
      updatedById: userId,
    });

    return this.branchRepository.save(branch);
  }

  @Cacheable({
    prefix: CACHE_PREFIXES.BRANCHES,
    ttl: CACHE_CONFIG.BRANCHES.DEFAULT_TTL,
  })
  async findAll(): Promise<Branch[]> {
    return this.branchRepository.find({
      relations: ['company', 'departments'],
      order: { createdAt: 'DESC' },
    });
  }

  @Cacheable({
    prefix: CACHE_PREFIXES.BRANCHES,
    ttl: CACHE_CONFIG.BRANCHES.DEFAULT_TTL,
    keyGenerator: (id: string) => CACHE_PATTERNS.BRANCHES.SINGLE(id),
  })
  async findOne(id: string): Promise<Branch> {
    const branch = await this.branchRepository.findOne({
      where: { id },
      relations: ['company', 'departments', 'createdBy', 'updatedBy'],
    });

    if (!branch) {
      throw new NotFoundException(`Branch with ID ${id} not found`);
    }

    return branch;
  }

  @CacheEvict([CACHE_PATTERNS.BRANCHES.ALL, CACHE_PATTERNS.COMPANIES.ALL])
  async update(id: string, updateBranchDto: UpdateBranchDto, userId: string): Promise<Branch> {
    const branch = await this.findOne(id);

    if (updateBranchDto.code && updateBranchDto.code !== branch.code) {
      const existingBranch = await this.branchRepository.findOne({
        where: { code: updateBranchDto.code },
      });

      if (existingBranch) {
        throw new BadRequestException(`Branch with code ${updateBranchDto.code} already exists`);
      }
    }

    // Si se está actualizando isMain a true
    if (updateBranchDto.isMain && !branch.isMain) {
      const existingMainBranch = await this.branchRepository.findOne({
        where: { companyId: branch.companyId, isMain: true },
      });

      if (existingMainBranch) {
        throw new BadRequestException('Company already has a main branch');
      }
    }

    Object.assign(branch, {
      ...updateBranchDto,
      updatedById: userId,
    });

    return this.branchRepository.save(branch);
  }

  @CacheEvict([CACHE_PATTERNS.BRANCHES.ALL, CACHE_PATTERNS.COMPANIES.ALL])
  async remove(id: string): Promise<void> {
    const branch = await this.findOne(id);

    // Verificar si tiene departamentos
    if (branch.departments && branch.departments.length > 0) {
      throw new BadRequestException('Cannot delete branch with existing departments');
    }

    await this.branchRepository.remove(branch);
  }

  @CacheEvict([CACHE_PATTERNS.BRANCHES.ALL, CACHE_PATTERNS.COMPANIES.ALL])
  async toggleActive(id: string, userId: string): Promise<Branch> {
    const branch = await this.findOne(id);
    branch.isActive = !branch.isActive;
    branch.updatedById = userId;

    // Si la sucursal se desactiva, verificar que no tenga departamentos activos
    if (!branch.isActive && branch.departments?.some((dept) => dept.isActive)) {
      throw new BadRequestException('Cannot deactivate branch with active departments');
    }

    return this.branchRepository.save(branch);
  }

  @Cacheable({
    prefix: CACHE_PREFIXES.BRANCHES,
    ttl: CACHE_CONFIG.BRANCHES.DEFAULT_TTL,
    keyGenerator: (companyId: string, filters?: any) =>
      `by-company:${companyId}:${JSON.stringify(filters)}`,
  })
  async findByCompany(companyId: string, filters?: { isActive?: boolean }): Promise<Branch[]> {
    const queryBuilder = this.branchRepository
      .createQueryBuilder('branch')
      .leftJoinAndSelect('branch.departments', 'departments')
      .where('branch.companyId = :companyId', { companyId });

    if (filters?.isActive !== undefined) {
      queryBuilder.andWhere('branch.isActive = :isActive', { isActive: filters.isActive });
    }

    return queryBuilder.orderBy('branch.isMain', 'DESC').addOrderBy('branch.name', 'ASC').getMany();
  }
}
