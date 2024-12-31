// src/modules/companies/services/companies.service.ts

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from '../entities/company.entity';
import { CacheManagerService } from '@/config/redis/cache-manager.service';
import { Cacheable, CacheEvict } from '@/common/decorators/cache.decorator';
import { CACHE_PREFIXES, CACHE_PATTERNS, CACHE_CONFIG } from '@/common/constants/cache.constants';
import { CreateCompanyDto } from '../dto/company/create-company.dto';
import { UpdateCompanyDto } from '../dto/company/update-company.dto';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    private readonly cacheManager: CacheManagerService,
  ) {}

  @CacheEvict(CACHE_PATTERNS.COMPANIES.ALL)
  async create(createCompanyDto: CreateCompanyDto, userId: string): Promise<Company> {
    // Verificar si ya existe una compañía con el mismo taxId
    const existingCompany = await this.companyRepository.findOne({
      where: { taxId: createCompanyDto.taxId },
    });

    if (existingCompany) {
      throw new BadRequestException(`Company with tax ID ${createCompanyDto.taxId} already exists`);
    }

    const company = this.companyRepository.create({
      ...createCompanyDto,
      createdById: userId,
      updatedById: userId,
    });

    return this.companyRepository.save(company);
  }

  @Cacheable({
    prefix: CACHE_PREFIXES.COMPANIES,
    ttl: CACHE_CONFIG.COMPANIES.DEFAULT_TTL,
  })
  async findAll(): Promise<Company[]> {
    return this.companyRepository.find({
      relations: ['branches'],
      order: { createdAt: 'DESC' },
    });
  }

  @Cacheable({
    prefix: CACHE_PREFIXES.COMPANIES,
    ttl: CACHE_CONFIG.COMPANIES.DEFAULT_TTL,
    keyGenerator: (id: string) => CACHE_PATTERNS.COMPANIES.SINGLE(id),
  })
  async findOne(id: string): Promise<Company> {
    const company = await this.companyRepository.findOne({
      where: { id },
      relations: ['branches', 'createdBy', 'updatedBy'],
    });

    if (!company) {
      throw new NotFoundException(`Company with ID ${id} not found`);
    }

    return company;
  }

  @CacheEvict(CACHE_PATTERNS.COMPANIES.ALL)
  async update(id: string, updateCompanyDto: UpdateCompanyDto, userId: string): Promise<Company> {
    const company = await this.findOne(id);

    // Verificar taxId único si se está actualizando
    if (updateCompanyDto.taxId && updateCompanyDto.taxId !== company.taxId) {
      const existingCompany = await this.companyRepository.findOne({
        where: { taxId: updateCompanyDto.taxId },
      });

      if (existingCompany) {
        throw new BadRequestException(
          `Company with tax ID ${updateCompanyDto.taxId} already exists`,
        );
      }
    }

    Object.assign(company, {
      ...updateCompanyDto,
      updatedById: userId,
    });

    return this.companyRepository.save(company);
  }

  @CacheEvict(CACHE_PATTERNS.COMPANIES.ALL)
  async remove(id: string): Promise<void> {
    const company = await this.findOne(id);

    // Verificar si tiene sucursales
    if (company.branches && company.branches.length > 0) {
      throw new BadRequestException('Cannot delete company with existing branches');
    }

    await this.companyRepository.remove(company);
  }

  @CacheEvict(CACHE_PATTERNS.COMPANIES.ALL)
  async toggleActive(id: string, userId: string): Promise<Company> {
    const company = await this.findOne(id);
    company.isActive = !company.isActive;
    company.updatedById = userId;

    // Si la compañía se desactiva, no puede tener sucursales activas
    if (!company.isActive && company.branches?.some((branch) => branch.isActive)) {
      throw new BadRequestException('Cannot deactivate company with active branches');
    }

    return this.companyRepository.save(company);
  }

  @Cacheable({
    prefix: CACHE_PREFIXES.COMPANIES,
    ttl: CACHE_CONFIG.COMPANIES.DEFAULT_TTL,
    keyGenerator: (isActive?: boolean) => `list:${isActive ?? 'all'}`,
  })
  async findAllWithFilters(filters?: { isActive?: boolean }): Promise<Company[]> {
    const queryBuilder = this.companyRepository
      .createQueryBuilder('company')
      .leftJoinAndSelect('company.branches', 'branches');

    if (filters?.isActive !== undefined) {
      queryBuilder.where('company.isActive = :isActive', { isActive: filters.isActive });
    }

    return queryBuilder.orderBy('company.name', 'ASC').getMany();
  }
}
