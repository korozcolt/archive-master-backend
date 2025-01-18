// src/modules/templates/templates.module.ts

import { Module } from '@nestjs/common';
import { Template } from './entities/template.entity';
import { TemplateVersion } from './entities/template-version.entity';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Template, TemplateVersion])],
  controllers: [TemplatesController],
  providers: [TemplatesService],
  exports: [TemplatesService],
})
export class TemplatesModule {}
