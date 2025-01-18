import { DataSource, Repository } from 'typeorm';

import { Document } from '../entities/document.entity';
import { DocumentStatus } from '../enums/document-status.enum';
import { DocumentType } from '../enums/document-type.enum';
import { Injectable } from '@nestjs/common';

@Injectable()
export class DocumentRepository extends Repository<Document> {
  constructor(private dataSource: DataSource) {
    super(Document, dataSource.createEntityManager());
  }

  // Búsqueda por tipo de documento
  async findByType(type: DocumentType): Promise<Document[]> {
    return this.find({
      where: { type },
      relations: ['createdBy', 'category'],
    });
  }

  // Búsqueda por estado
  async findByStatus(status: DocumentStatus): Promise<Document[]> {
    return this.find({
      where: { status },
      relations: ['createdBy', 'category'],
    });
  }

  // Búsqueda con filtros avanzados
  async searchDocuments(filters: {
    type?: DocumentType;
    status?: DocumentStatus;
    categoryId?: string;
    createdById?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Document[]> {
    const query = this.createQueryBuilder('document')
      .leftJoinAndSelect('document.createdBy', 'createdBy')
      .leftJoinAndSelect('document.category', 'category')
      .leftJoinAndSelect('document.versions', 'versions');

    if (filters.type) {
      query.andWhere('document.type = :type', { type: filters.type });
    }

    if (filters.status) {
      query.andWhere('document.status = :status', { status: filters.status });
    }

    if (filters.categoryId) {
      query.andWhere('document.category.id = :categoryId', { categoryId: filters.categoryId });
    }

    if (filters.createdById) {
      query.andWhere('document.createdBy.id = :createdById', { createdById: filters.createdById });
    }

    if (filters.startDate) {
      query.andWhere('document.createdAt >= :startDate', { startDate: filters.startDate });
    }

    if (filters.endDate) {
      query.andWhere('document.createdAt <= :endDate', { endDate: filters.endDate });
    }

    return query.getMany();
  }

  // Obtener documentos recientes
  async getRecentDocuments(limit: number = 10): Promise<Document[]> {
    return this.find({
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['createdBy', 'category'],
    });
  }

  // Contar documentos por tipo
  async countByType(): Promise<Record<DocumentType, number>> {
    const counts = await this.createQueryBuilder('document')
      .select('document.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('document.type')
      .getRawMany();

    return counts.reduce(
      (acc, item) => {
        acc[item.type] = parseInt(item.count, 10);
        return acc;
      },
      {} as Record<DocumentType, number>,
    );
  }
}
