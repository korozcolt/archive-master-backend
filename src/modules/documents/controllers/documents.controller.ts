// src/modules/documents/controllers/document.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  StreamableFile,
  Response,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes, ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateDocumentDto } from '../dto/create-document.dto';
import { UpdateDocumentDto } from '../dto/update-document.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { GetUser } from '@/common/decorators/get-user.decorator';
import { User } from '@/modules/users/entities/user.entity';
import { Response as ExpressResponse } from 'express';
import { DocumentsService } from '../services/documents.service';
import { Readable } from 'stream';
import { FindDocumentsDto } from '../dto/find-documents.dto';
import { PaginatedDocumentResponseDto } from '@/common/classes/pagination.class';
import { PaginatedResponse } from '@/common/interfaces/pagination.interface';
import { Document } from '../entities/document.entity';

@ApiTags('Documents')
@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documentService: DocumentsService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          'application/pdf',
          'image/jpeg',
          'image/png',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              `File type ${file.mimetype} not allowed. Allowed types: ${allowedMimes.join(', ')}`,
            ),
            false,
          );
        }
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'title', 'type'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        title: {
          type: 'string',
          example: 'Contract 2024',
        },
        description: {
          type: 'string',
          nullable: true,
          example: 'Annual service contract',
        },
        type: {
          type: 'string',
          enum: ['contract', 'invoice', 'report', 'internal_memo', 'other'],
          example: 'contract',
        },
        categoryId: {
          type: 'string',
          format: 'uuid',
          nullable: true,
          example: '123e4567-e89b-12d3-a456-426614174000',
        },
        metadata: {
          type: 'object',
          nullable: true,
          example: {
            department: 'Legal',
            contractNumber: 'CT-2024-001',
          },
        },
      },
    },
  })
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() createDocumentDto: CreateDocumentDto,
    @GetUser() user: User,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    return this.documentService.create(createDocumentDto, file, user);
  }

  @Post(':id/versions')
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          'application/pdf',
          'image/jpeg',
          'image/png',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              `File type ${file.mimetype} not allowed. Allowed types: ${allowedMimes.join(', ')}`,
            ),
            false,
          );
        }
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        comment: {
          type: 'string',
          example: 'Updated contract terms',
        },
      },
    },
  })
  async createVersion(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('comment') comment: string,
    @GetUser() user: User,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    return this.documentService.createVersion(id, file, user, comment);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.documentService.findOne(id);
  }

  @Get()
  @ApiOperation({ summary: 'Search and filter documents' })
  @ApiResponse({
    status: 200,
    description: 'Returns paginated documents',
    type: PaginatedDocumentResponseDto,
  })
  async findAll(@Query() filters: FindDocumentsDto): Promise<PaginatedResponse<Document>> {
    return this.documentService.findAll(filters);
  }

  @Get(':id/versions/:version')
  async getVersion(@Param('id') id: string, @Param('version', ParseIntPipe) version: number) {
    return this.documentService.findVersion(id, version);
  }

  @Get(':id/download')
  async downloadFile(
    @Param('id') id: string,
    @Query('version', ParseIntPipe) version: number,
    @Response({ passthrough: true }) res: ExpressResponse,
  ): Promise<StreamableFile> {
    const document = await this.documentService.findOne(id);
    const downloadUrl = await this.documentService.getFileUrl(id, version);
    const stream = await this.documentService.getFileStream(downloadUrl);

    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${document.title}"`,
    });

    return new StreamableFile(stream as Readable);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDocumentDto: UpdateDocumentDto,
    @GetUser() user: User,
  ) {
    return this.documentService.update(id, updateDocumentDto, user);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.documentService.remove(id);
  }
}
