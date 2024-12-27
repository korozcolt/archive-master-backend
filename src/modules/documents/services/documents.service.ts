import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DocumentRepository } from '../repositories/document.repository';
import { Document } from '../entities/document.entity';
import { CreateDocumentDto } from '../dto/create-document.dto';
import { UpdateDocumentDto } from '../dto/update-document.dto';
import { DocumentType } from '../enums/document-type.enum';
import { DocumentStatus } from '../enums/document-status.enum';
import { User } from '../../users/entities/user.entity';
import { Category } from '../../categories/entities/category.entity';
import { Repository } from 'typeorm';
import { VersioningService } from '@/common/versioning/services/versioning.service';
import { CacheManagerService } from '@/config/redis/cache-manager.service';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(DocumentRepository)
    private documentRepository: DocumentRepository,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    private versioningService: VersioningService,
    private readonly cacheManager: CacheManagerService,
  ) {}

  // Crear nuevo documento
  async createDocument(createDocumentDto: CreateDocumentDto, user: User): Promise<Document> {
    const document = new Document();
    document.title = createDocumentDto.title;
    document.description = createDocumentDto.description;
    document.type = createDocumentDto.type;
    document.metadata = createDocumentDto.metadata || {};
    document.createdBy = user;
    document.currentVersionNumber = 1;

    // Manejar categoría si se proporciona
    if (createDocumentDto.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: createDocumentDto.categoryId },
      });
      if (!category) {
        throw new NotFoundException('Category not found');
      }
      document.category = category;
    }

    // Crear primera versión
    return document.save(user, this.documentRepository, this.versioningService);
  }

  // Actualizar documento
  async updateDocument(
    documentId: string,
    updateDocumentDto: UpdateDocumentDto,
    user: User,
  ): Promise<Document> {
    const document = await this.documentRepository.findOne({
      where: { id: documentId },
      relations: ['createdBy', 'category'],
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    // Actualizar campos
    if (updateDocumentDto.title) document.title = updateDocumentDto.title;
    if (updateDocumentDto.description) document.description = updateDocumentDto.description;
    if (updateDocumentDto.type) document.type = updateDocumentDto.type;
    if (updateDocumentDto.metadata)
      document.metadata = {
        ...document.metadata,
        ...updateDocumentDto.metadata,
      };
    if (updateDocumentDto.status) document.status = updateDocumentDto.status;

    // Manejar cambio de categoría
    if (updateDocumentDto.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: updateDocumentDto.categoryId },
      });
      if (!category) {
        throw new NotFoundException('Category not found');
      }
      document.category = category;
    }

    // Guardar y versionar
    return document.save(user, this.documentRepository, this.versioningService);
  }

  // Métodos adicionales de búsqueda y filtrado
  async findDocuments(filters: {
    type?: DocumentType;
    status?: DocumentStatus;
    categoryId?: string;
    createdById?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Document[]> {
    return this.documentRepository.searchDocuments(filters);
  }

  async getDocumentById(documentId: string): Promise<Document> {
    const document = await this.documentRepository.findOne({
      where: { id: documentId },
      relations: ['createdBy', 'category', 'versions'],
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return document;
  }

  // Eliminar documento
  async deleteDocument(documentId: string): Promise<void> {
    const result = await this.documentRepository.delete(documentId);

    if (result.affected === 0) {
      throw new NotFoundException('Document not found');
    }
  }

  // Obtener estadísticas
  async getDocumentStatistics(): Promise<{
    totalDocuments: number;
    documentsByType: Record<DocumentType, number>;
    documentsByStatus: Record<DocumentStatus, number>;
  }> {
    const totalDocuments = await this.documentRepository.count();
    const documentsByType = await this.documentRepository.countByType();

    const documentsByStatus = await this.documentRepository
      .createQueryBuilder('document')
      .select('document.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('document.status')
      .getRawMany();

    return {
      totalDocuments,
      documentsByType,
      documentsByStatus: documentsByStatus.reduce(
        (acc, item) => {
          acc[item.status] = parseInt(item.count, 10);
          return acc;
        },
        {} as Record<DocumentStatus, number>,
      ),
    };
  }
}
