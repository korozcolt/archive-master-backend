// src/modules/search/services/search.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets, MoreThanOrEqual } from 'typeorm';
import { Document } from '@/modules/documents/entities/document.entity';
import { SearchOptions } from '../interfaces/search-options.interface';
import { SearchResultDto } from '../dto/search-result.dto';
import { CacheManagerService } from '@/config/redis/cache-manager.service';
import { CACHE_PREFIXES, CACHE_CONFIG } from '@/common/constants/cache.constants';
import { Cacheable } from '@/common/decorators/cache.decorator';
import { SearchQueryDto } from '../dto/search-query.dto';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    private readonly cacheManager: CacheManagerService,
  ) {}

  @Cacheable({
    prefix: CACHE_PREFIXES.DOCUMENTS,
    ttl: CACHE_CONFIG.DOCUMENTS.DEFAULT_TTL,
    keyGenerator: (query: string, options: SearchOptions) =>
      `search:${JSON.stringify({ q: query, ...options })}`,
  })
  async search(query: string, options: SearchOptions): Promise<SearchResultDto> {
    try {
      const queryBuilder = this.documentRepository
        .createQueryBuilder('document')
        .leftJoinAndSelect('document.category', 'category')
        .leftJoinAndSelect('document.createdBy', 'createdBy')
        .leftJoinAndSelect('document.versions', 'versions');

      // Búsqueda full-text
      if (query) {
        queryBuilder
          .where(
            new Brackets((qb) => {
              qb.where(
                'MATCH(document.title, document.description) AGAINST (:query IN BOOLEAN MODE)',
                {
                  query: `${query}*`,
                },
              ).orWhere('JSON_CONTAINS_PATH(document.metadata, "one", :metadataPath)', {
                metadataPath: `$.*.${query}`,
              });
            }),
          )
          .orderBy('MATCH(document.title, document.description) AGAINST (:query)', 'DESC');
      }

      // Aplicar filtros
      this.applyFilters(queryBuilder, options);

      // Paginación
      const page = options.page || 1;
      const limit = options.limit || 10;
      const skip = (page - 1) * limit;

      const [items, total] = await queryBuilder.skip(skip).take(limit).getManyAndCount();

      // Procesar highlights
      const highlights = this.processHighlights(items, query);

      return {
        items,
        total,
        page,
        lastPage: Math.ceil(total / limit),
        highlights,
      };
    } catch (error) {
      this.logger.error(`Error en búsqueda: ${error}`, error);
      throw error;
    }
  }

  private applyFilters(queryBuilder: any, options: SearchOptions): void {
    if (options.type) {
      queryBuilder.andWhere('document.type = :type', { type: options.type });
    }

    if (options.categoryIds?.length) {
      queryBuilder.andWhere('document.categoryId IN (:...categoryIds)', {
        categoryIds: options.categoryIds,
      });
    }

    if (options.status) {
      queryBuilder.andWhere('document.status = :status', { status: options.status });
    }

    if (options.fromDate) {
      queryBuilder.andWhere('document.createdAt >= :fromDate', {
        fromDate: options.fromDate,
      });
    }

    if (options.toDate) {
      queryBuilder.andWhere('document.createdAt <= :toDate', {
        toDate: options.toDate,
      });
    }

    if (options.metadata) {
      Object.entries(options.metadata).forEach(([key, value]) => {
        queryBuilder.andWhere(`JSON_EXTRACT(document.metadata, '$.${key}') = :value${key}`, {
          [`value${key}`]: value,
        });
      });
    }

    // Ordenamiento
    if (options.sortBy) {
      queryBuilder.orderBy(`document.${options.sortBy}`, options.sortOrder || 'DESC');
    } else {
      queryBuilder.orderBy('document.createdAt', 'DESC');
    }
  }

  private processHighlights(items: Document[], query: string): string[] {
    if (!query) return [];

    return [
      ...new Set(
        items
          .map((doc) => {
            const matches = [];
            // Buscar en título
            const titleMatches = doc.title.match(new RegExp(query, 'gi')) || [];
            matches.push(...titleMatches);

            // Buscar en descripción
            if (doc.description) {
              const descMatches = doc.description.match(new RegExp(query, 'gi')) || [];
              matches.push(...descMatches);
            }

            // Buscar en metadata
            if (doc.metadata) {
              const metadataStr = JSON.stringify(doc.metadata);
              const metaMatches = metadataStr.match(new RegExp(query, 'gi')) || [];
              matches.push(...metaMatches);
            }

            return matches;
          })
          .flat(),
      ),
    ];
  }

  async suggestSearchTerms(partial: string): Promise<string[]> {
    try {
      const queryBuilder = this.documentRepository
        .createQueryBuilder('document')
        .select(['document.title', 'document.description'])
        .where(
          new Brackets((qb) => {
            qb.where('document.title LIKE :partial', { partial: `%${partial}%` }).orWhere(
              'document.description LIKE :partial',
              { partial: `%${partial}%` },
            );
          }),
        )
        .limit(5);

      const results = await queryBuilder.getRawMany();

      return Array.from(
        new Set(
          results
            .map((r) => {
              const matches = [];
              if (r.document_title) {
                matches.push(...(r.document_title.match(new RegExp(partial, 'gi')) || []));
              }
              if (r.document_description) {
                matches.push(...(r.document_description.match(new RegExp(partial, 'gi')) || []));
              }
              return matches;
            })
            .flat(),
        ),
      );
    } catch (error) {
      this.logger.error(`Error en sugerencias: ${error}`);
      return [];
    }
  }

  async reindexDocuments(): Promise<void> {
    try {
      await this.documentRepository.query('REPAIR TABLE documents QUICK');
      await this.documentRepository.query('OPTIMIZE TABLE documents');
      this.logger.log('Reindexación completada exitosamente');
    } catch (error) {
      this.logger.error(`Error en reindexación: ${error}`);
      throw error;
    }
  }

  // Agregar al SearchService

  async getFacets(query: SearchQueryDto) {
    const queryBuilder = this.documentRepository.createQueryBuilder('document');

    // Aplicar filtros base
    if (query.fromDate) {
      queryBuilder.andWhere('document.createdAt >= :fromDate', {
        fromDate: new Date(query.fromDate),
      });
    }

    if (query.toDate) {
      queryBuilder.andWhere('document.createdAt <= :toDate', {
        toDate: new Date(query.toDate),
      });
    }

    // Obtener conteos por tipo
    const types = await queryBuilder
      .select('document.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('document.type')
      .getRawMany();

    // Obtener conteos por categoría
    const categories = await queryBuilder
      .select('category.name', 'category')
      .addSelect('COUNT(*)', 'count')
      .leftJoin('document.category', 'category')
      .groupBy('category.id')
      .getRawMany();

    // Obtener conteos por estado
    const status = await queryBuilder
      .select('document.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('document.status')
      .getRawMany();

    // Generar rangos de fechas
    const dateRanges = await this.calculateDateRanges();

    return {
      types,
      categories,
      status,
      dateRanges,
    };
  }

  private async calculateDateRanges() {
    const now = new Date();
    const ranges = [
      {
        label: 'Último día',
        start: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      },
      {
        label: 'Última semana',
        start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      },
      {
        label: 'Último mes',
        start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      },
      {
        label: 'Último año',
        start: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
      },
    ];

    const counts = await Promise.all(
      ranges.map(async (range) => {
        const count = await this.documentRepository.count({
          where: {
            createdAt: MoreThanOrEqual(range.start),
          },
        });
        return { ...range, count };
      }),
    );

    return counts;
  }

  async getSearchStats() {
    const stats = {
      total: await this.documentRepository.count(),
      byType: await this.documentRepository
        .createQueryBuilder('document')
        .select('document.type', 'type')
        .addSelect('COUNT(*)', 'count')
        .groupBy('document.type')
        .getRawMany(),
      topCategories: await this.documentRepository
        .createQueryBuilder('document')
        .select('category.name', 'category')
        .addSelect('COUNT(*)', 'count')
        .leftJoin('document.category', 'category')
        .groupBy('category.id')
        .orderBy('count', 'DESC')
        .limit(5)
        .getRawMany(),
      recentActivity: await this.documentRepository
        .createQueryBuilder('document')
        .select('DATE(document.createdAt)', 'date')
        .addSelect('COUNT(*)', 'count')
        .groupBy('date')
        .orderBy('date', 'DESC')
        .limit(7)
        .getRawMany(),
    };

    return stats;
  }
}
