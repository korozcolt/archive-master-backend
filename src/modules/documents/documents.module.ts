import { CategoriesModule } from '../categories/categories.module';
import { Category } from '../categories/entities/category.entity';
import { Document } from './entities/document.entity';
import { DocumentRepository } from './repositories/document.repository';
import { DocumentVersion } from './entities/document-version.entity';
import { DocumentsController } from './controllers/documents.controller';
import { DocumentsService } from './services/documents.service';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { VersioningModule } from '@/common/versioning/versioning.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Document, DocumentVersion, DocumentRepository, User, Category]),
    UsersModule,
    CategoriesModule,
    VersioningModule,
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService, DocumentRepository],
  exports: [DocumentsService, DocumentRepository],
})
export class DocumentsModule {}
