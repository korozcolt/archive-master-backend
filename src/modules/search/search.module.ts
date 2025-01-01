// src/modules/search/search.module.ts

import { CacheInterceptor } from '@/common/interceptors/cache.interceptor';
import { CacheManagerService } from '@/config/redis/cache-manager.service';
import { ConfigModule } from '@nestjs/config';
import { Document } from '@/modules/documents/entities/document.entity';
import { Module } from '@nestjs/common';
import { RedisModule } from '@/config/redis/redis-cache.module';
import { SearchController } from './controllers/search.controller';
import { SearchService } from './services/search.service';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Document]), RedisModule, ConfigModule],
  controllers: [SearchController],
  providers: [SearchService, CacheInterceptor, CacheManagerService],
  exports: [SearchService],
})
export class SearchModule {}
