// src/modules/documents/services/document.service.ts

import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Brackets } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Document } from '../entities/document.entity';
import { DocumentVersion } from '../entities/document-version.entity';
import { StorageConfig, StorageService } from '@/config/storage/storage.service';
import { CreateDocumentDto } from '../dto/create-document.dto';
import { UpdateDocumentDto } from '../dto/update-document.dto';
import { User } from '@/modules/users/entities/user.entity';
import { Category } from '@/modules/categories/entities/category.entity';
import { CacheManagerService } from '@/config/redis/cache-manager.service';
import { CACHE_PATTERNS } from '@/common/constants/cache.constants';
import * as fs from 'fs';
import * as path from 'path';
import { Readable } from 'stream';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { FindDocumentsDto } from '../dto/find-documents.dto';

interface FileUploadResult {
  path: string;
  metadata: Record<string, any>;
}

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);
  private readonly config: StorageConfig;
  private readonly s3Client: S3Client;

  constructor(
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
    @InjectRepository(DocumentVersion)
    private versionRepository: Repository<DocumentVersion>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    private storageService: StorageService,
    private configService: ConfigService,
    private dataSource: DataSource,
    private cacheManager: CacheManagerService,
  ) {
    this.config = {
      type: configService.get('STORAGE_TYPE', 'local'),
      localPath: configService.get('STORAGE_LOCAL_PATH', './uploads'),
    };

    if (this.config.type === 's3') {
      this.s3Client = new S3Client({
        region: configService.get('AWS_REGION'),
        credentials: {
          accessKeyId: configService.get('AWS_ACCESS_KEY_ID'),
          secretAccessKey: configService.get('AWS_SECRET_ACCESS_KEY'),
        },
      });
    }
  }

  async create(
    createDocumentDto: CreateDocumentDto,
    file: Express.Multer.File,
    user: User,
  ): Promise<Document> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validar categoría si se proporciona
      if (createDocumentDto.categoryId) {
        const category = await this.categoryRepository.findOne({
          where: { id: createDocumentDto.categoryId },
        });
        if (!category) {
          throw new NotFoundException('Category not found');
        }
      }

      // Subir archivo
      const uploadResult = await this.uploadFile(file, createDocumentDto.metadata || {});

      // Crear documento
      const document = this.documentRepository.create({
        ...createDocumentDto,
        createdBy: user,
        currentVersionNumber: 1,
      });

      const savedDocument = await queryRunner.manager.save(Document, document);

      // Crear primera versión
      const version = this.versionRepository.create({
        document: savedDocument,
        versionNumber: 1,
        content: uploadResult.path,
        changes: {
          action: 'create',
          timestamp: new Date(),
          user: user.id,
        },
        createdBy: user,
      });

      await queryRunner.manager.save(DocumentVersion, version);
      await queryRunner.commitTransaction();

      // Invalidar caché
      await this.cacheManager.invalidatePattern(CACHE_PATTERNS.DOCUMENTS.ALL);

      return this.findOne(savedDocument.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Error creating document:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async createVersion(
    documentId: string,
    file: Express.Multer.File,
    user: User,
    comment?: string,
  ): Promise<DocumentVersion> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const document = await this.findOne(documentId);
      const uploadResult = await this.uploadFile(file, document.metadata || {});

      const newVersion = this.versionRepository.create({
        document,
        versionNumber: document.currentVersionNumber + 1,
        content: uploadResult.path,
        changes: {
          action: 'update',
          timestamp: new Date(),
          user: user.id,
          comment,
        },
        createdBy: user,
      });

      document.currentVersionNumber += 1;

      await queryRunner.manager.save(DocumentVersion, newVersion);
      await queryRunner.manager.save(Document, document);
      await queryRunner.commitTransaction();

      await this.cacheManager.invalidatePattern(CACHE_PATTERNS.DOCUMENTS.VERSIONS(documentId));

      return this.findVersion(documentId, newVersion.versionNumber);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Error creating version:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findOne(id: string): Promise<Document> {
    const document = await this.documentRepository.findOne({
      where: { id },
      relations: ['category', 'createdBy', 'versions'],
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    return document;
  }

  async findAll(filters: FindDocumentsDto): Promise<Document[]> {
    const queryBuilder = this.documentRepository
      .createQueryBuilder('document')
      .leftJoinAndSelect('document.category', 'category')
      .leftJoinAndSelect('document.createdBy', 'createdBy')
      .leftJoinAndSelect('document.versions', 'versions');

    if (filters.search) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where(
            'MATCH(document.title, document.description) AGAINST (:search IN BOOLEAN MODE)',
            { search: filters.search },
          )
            .orWhere('document.title LIKE :searchLike', { searchLike: `%${filters.search}%` })
            .orWhere('document.description LIKE :searchLike', {
              searchLike: `%${filters.search}%`,
            });
        }),
      );
    }

    if (filters.type) {
      queryBuilder.andWhere('document.type = :type', { type: filters.type });
    }

    if (filters.categoryId) {
      queryBuilder.andWhere('document.categoryId = :categoryId', {
        categoryId: filters.categoryId,
      });
    }

    if (filters.startDate) {
      queryBuilder.andWhere('document.createdAt >= :startDate', { startDate: filters.startDate });
    }

    if (filters.endDate) {
      queryBuilder.andWhere('document.createdAt <= :endDate', { endDate: filters.endDate });
    }

    if (filters.metadata) {
      Object.entries(filters.metadata).forEach(([key, value]) => {
        queryBuilder.andWhere(`JSON_EXTRACT(document.metadata, '$.${key}') = :value${key}`, {
          [`value${key}`]: value,
        });
      });
    }

    return await queryBuilder.orderBy('document.updatedAt', 'DESC').cache(true).getMany();
  }

  async findVersion(documentId: string, versionNumber: number): Promise<DocumentVersion> {
    const version = await this.versionRepository.findOne({
      where: { document: { id: documentId }, versionNumber },
      relations: ['document', 'createdBy'],
    });

    if (!version) {
      throw new NotFoundException(`Version ${versionNumber} not found for document ${documentId}`);
    }

    return version;
  }

  async getFileUrl(documentId: string, versionNumber?: number): Promise<string> {
    const document = await this.findOne(documentId);
    const version = await this.versionRepository.findOne({
      where: {
        document: { id: documentId },
        versionNumber: versionNumber || document.currentVersionNumber,
      },
    });

    if (!version) {
      throw new NotFoundException('Version not found');
    }

    return this.storageService.getFileUrl(version.content);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async update(id: string, updateDocumentDto: UpdateDocumentDto, user: User): Promise<Document> {
    const document = await this.findOne(id);

    if (updateDocumentDto.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: updateDocumentDto.categoryId },
      });
      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    Object.assign(document, updateDocumentDto);
    const updatedDocument = await this.documentRepository.save(document);
    await this.cacheManager.invalidatePattern(CACHE_PATTERNS.DOCUMENTS.SINGLE(id));

    return updatedDocument;
  }

  async remove(id: string): Promise<void> {
    const document = await this.findOne(id);
    const versions = await this.versionRepository.find({
      where: { document: { id } },
    });

    // Eliminar archivos físicos
    for (const version of versions) {
      await this.storageService.deleteFile(version.content);
    }

    await this.documentRepository.remove(document);
    await this.cacheManager.invalidatePattern(CACHE_PATTERNS.DOCUMENTS.ALL);
  }

  private async uploadFile(
    file: Express.Multer.File,
    metadata: Record<string, any>,
  ): Promise<FileUploadResult> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const allowedTypes = this.configService.get('ALLOWED_FILE_TYPES', '').split(',');
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('File type not allowed');
    }

    const maxSize = this.configService.get('MAX_FILE_SIZE', 5 * 1024 * 1024); // 5MB default
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds limit');
    }

    const path = await this.storageService.uploadFile(file, 'documents', {
      ...metadata,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size.toString(),
    });

    return {
      path,
      metadata: {
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      },
    };
  }

  async getFileStream(filePath: string): Promise<Readable> {
    if (this.config.type === 's3') {
      const command = new GetObjectCommand({
        Bucket: this.config.s3.bucket,
        Key: filePath,
      });
      const response = await this.s3Client.send(command);
      return response.Body as Readable;
    } else {
      const fullPath = path.join(this.config.localPath, filePath);
      return fs.createReadStream(fullPath);
    }
  }
}
