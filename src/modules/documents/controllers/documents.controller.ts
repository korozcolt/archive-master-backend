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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { CreateDocumentDto } from '../dto/create-document.dto';
import { UpdateDocumentDto } from '../dto/update-document.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { GetUser } from '@/common/decorators/get-user.decorator';
import { User } from '@/modules/users/entities/user.entity';
import { Response as ExpressResponse } from 'express';
import { DocumentsService } from '../services/documents.service';
import { Readable } from 'stream';

@ApiTags('Documents')
@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documentService: DocumentsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        title: {
          type: 'string',
        },
        description: {
          type: 'string',
          nullable: true,
        },
        type: {
          type: 'string',
          enum: ['contract', 'invoice', 'report', 'internal_memo', 'other'],
        },
        categoryId: {
          type: 'string',
          format: 'uuid',
          nullable: true,
        },
        metadata: {
          type: 'object',
          nullable: true,
        },
      },
    },
  })
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() createDocumentDto: CreateDocumentDto,
    @GetUser() user: User,
  ) {
    return this.documentService.create(createDocumentDto, file, user);
  }

  @Post(':id/versions')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  async createVersion(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('comment') comment: string,
    @GetUser() user: User,
  ) {
    return this.documentService.createVersion(id, file, user, comment);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.documentService.findOne(id);
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
