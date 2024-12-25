import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DocumentsService } from '../services/documents.service';
import { CreateDocumentDto } from '../dto/create-document.dto';
import { UpdateDocumentDto } from '../dto/update-document.dto';
import { DocumentResponseDto } from '../dto/document-response.dto';
import { DocumentType } from '../enums/document-type.enum';
import { DocumentStatus } from '../enums/document-status.enum';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { User } from '../../users/entities/user.entity';
import { Document } from '../entities/document.entity';
import { GetUser } from '@/common/decorators/get-user.decorator';
import { UserResponseDto } from '@/modules/users/dto/user-response.dto';
import { CategoryResponseDto } from '@/modules/categories/dto/category-response.dto';

@ApiTags('Documents')
@Controller('documents')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DocumentsController {
  constructor(private documentsService: DocumentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new document' })
  @ApiResponse({
    status: 201,
    description: 'Document created',
    type: DocumentResponseDto,
  })
  async createDocument(
    @Body() createDocumentDto: CreateDocumentDto,
    @GetUser() user: User,
  ): Promise<DocumentResponseDto> {
    const document = await this.documentsService.createDocument(createDocumentDto, user);
    return this.mapToResponseDto(document);
  }

  @Get()
  @ApiOperation({ summary: 'Search documents' })
  @ApiResponse({
    status: 200,
    description: 'List of documents',
    type: [DocumentResponseDto],
  })
  async findDocuments(
    @Query('type') type?: DocumentType,
    @Query('status') status?: DocumentStatus,
    @Query('categoryId') categoryId?: string,
    @Query('createdById') createdById?: string,
    @Query('startDate') startDate?: Date,
    @Query('endDate') endDate?: Date,
  ): Promise<DocumentResponseDto[]> {
    const documents = await this.documentsService.findDocuments({
      type,
      status,
      categoryId,
      createdById,
      startDate,
      endDate,
    });
    return documents.map((doc) => this.mapToResponseDto(doc));
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get document statistics' })
  async getDocumentStatistics() {
    return this.documentsService.getDocumentStatistics();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document by ID' })
  @ApiResponse({
    status: 200,
    description: 'Document details',
    type: DocumentResponseDto,
  })
  async getDocumentById(@Param('id') documentId: string): Promise<DocumentResponseDto> {
    const document = await this.documentsService.getDocumentById(documentId);
    return this.mapToResponseDto(document);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update document' })
  @ApiResponse({
    status: 200,
    description: 'Updated document',
    type: DocumentResponseDto,
  })
  async updateDocument(
    @Param('id') documentId: string,
    @Body() updateDocumentDto: UpdateDocumentDto,
    @GetUser() user: User,
  ): Promise<DocumentResponseDto> {
    const document = await this.documentsService.updateDocument(
      documentId,
      updateDocumentDto,
      user,
    );
    return this.mapToResponseDto(document);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete document' })
  @ApiResponse({ status: 200, description: 'Document deleted' })
  async deleteDocument(@Param('id') documentId: string): Promise<void> {
    await this.documentsService.deleteDocument(documentId);
  }

  // Método de mapeo para conversión de entidad a DTO
  private mapToResponseDto(document: Document): DocumentResponseDto {
    return {
      id: document.id,
      title: document.title,
      description: document.description,
      type: document.type,
      status: document.status,
      metadata: document.metadata,
      currentVersionNumber: document.currentVersionNumber,
      createdBy: document.createdBy
        ? new UserResponseDto({
            id: document.createdBy.id,
            email: document.createdBy.email,
            firstName: document.createdBy.firstName,
            lastName: document.createdBy.lastName,
            isActive: document.createdBy.isActive,
            role: document.createdBy.role,
            lastLogin: document.createdBy.lastLogin,
            createdAt: document.createdBy.createdAt,
            updatedAt: document.createdBy.updatedAt,
          })
        : undefined,
      category: document.category
        ? new CategoryResponseDto({
            id: document.category.id,
            name: document.category.name,
            slug: document.category.slug,
            description: document.category.description,
            isActive: document.category.isActive,
            order: document.category.order,
            createdAt: document.category.createdAt,
            updatedAt: document.category.updatedAt,
            parentId: document.category.parentId,
          })
        : undefined,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    };
  }
}
