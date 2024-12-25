// src/modules/tags/tags.module.ts

import { Module } from '@nestjs/common';
import { Tag } from './entities/tag.entity';
import { TagRelation } from './entities/tag-relation.entity';
import { TagsController } from './tags.controller';
import { TagsService } from './tags.service';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Tag, TagRelation])],
  controllers: [TagsController],
  providers: [TagsService],
  exports: [TagsService],
})
export class TagsModule {}
