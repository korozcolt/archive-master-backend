// src/modules/categories/categories.module.ts

import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';
import { Category } from './entities/category.entity';
import { CategoryCacheHealthIndicator } from './health/category-cache.health';
import { Module } from '@nestjs/common';
import { RedisModule } from '@/config/redis/redis-cache.module';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Category]), RedisModule],
  controllers: [CategoriesController],
  providers: [CategoriesService, CategoryCacheHealthIndicator],
  exports: [CategoriesService],
})
export class CategoriesModule {}
