// src/modules/companies/companies.module.ts

import { Branch } from './entities/branch.entity';
import { BranchesController } from './controllers/branches.controller';
import { BranchesService } from './services/branches.service';
import { CompaniesController } from './controllers/companies.controller';
import { CompaniesService } from './services/companies.service';
import { Company } from './entities/company.entity';
import { Department } from './entities/department.entity';
import { DepartmentsController } from './controllers/departments.controller';
import { DepartmentsService } from './services/departments.service';
import { Module } from '@nestjs/common';
import { RedisModule } from '@/config/redis/redis-cache.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { VersioningModule } from '@/common/versioning/versioning.module';

@Module({
  imports: [
    // Registrar las entidades con TypeORM
    TypeOrmModule.forFeature([Company, Branch, Department]),

    // Módulos requeridos
    RedisModule,
    UsersModule,
    VersioningModule,
  ],
  controllers: [CompaniesController, BranchesController, DepartmentsController],
  providers: [CompaniesService, BranchesService, DepartmentsService],
  exports: [CompaniesService, BranchesService, DepartmentsService],
})
export class CompaniesModule {}
