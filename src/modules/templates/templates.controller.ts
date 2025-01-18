// src/modules/templates/templates.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { CreateTemplateVersionDto } from './dto/create-template-version.dto';
import { TemplateResponseDto } from './dto/template-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create a new template' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Template has been created successfully',
    type: TemplateResponseDto,
  })
  create(@Body() createTemplateDto: CreateTemplateDto, @Request() req) {
    return this.templatesService.create(createTemplateDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all templates' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return all templates',
    type: [TemplateResponseDto],
  })
  findAll() {
    return this.templatesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get template by id' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return the template',
    type: TemplateResponseDto,
  })
  findOne(@Param('id') id: string) {
    return this.templatesService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update template' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Template has been updated successfully',
    type: TemplateResponseDto,
  })
  update(@Param('id') id: string, @Body() updateTemplateDto: UpdateTemplateDto, @Request() req) {
    return this.templatesService.update(id, updateTemplateDto, req.user.id);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete template' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Template has been deleted successfully',
  })
  remove(@Param('id') id: string) {
    return this.templatesService.remove(id);
  }

  @Post(':id/versions')
  @Roles('admin')
  @ApiOperation({ summary: 'Create a new template version' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Template version has been created successfully',
  })
  createVersion(
    @Param('id') id: string,
    @Body() createVersionDto: CreateTemplateVersionDto,
    @Request() req,
  ) {
    return this.templatesService.createVersion(id, createVersionDto, req.user.id);
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'Get all versions of a template' })
  findVersions(@Param('id') id: string) {
    return this.templatesService.findVersions(id);
  }

  @Get(':id/versions/:version')
  @ApiOperation({ summary: 'Get specific version of a template' })
  findVersion(@Param('id') id: string, @Param('version', ParseIntPipe) version: number) {
    return this.templatesService.findVersion(id, version);
  }

  @Post(':id/validate')
  @ApiOperation({ summary: 'Validate fields against template schema' })
  validateFields(@Param('id') id: string, @Body() fields: Record<string, any>) {
    return this.templatesService.validateTemplateFields(id, fields);
  }
}
