// src/modules/tags/tags.controller.ts
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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { CreateTagRelationDto } from './dto/create-tag-relation.dto';
import { TagResponseDto } from './dto/tag-response.dto';
import { TagRelationResponseDto } from './dto/tag-relation-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Tags')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create a new tag' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Tag has been created successfully',
    type: TagResponseDto,
  })
  create(@Body() createTagDto: CreateTagDto, @Request() req) {
    return this.tagsService.create(createTagDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tags' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return all tags',
    type: [TagResponseDto],
  })
  findAll() {
    return this.tagsService.findAll();
  }

  @Get('tree')
  @ApiOperation({ summary: 'Get tags tree structure' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return tags in tree structure',
    type: [TagResponseDto],
  })
  getTree() {
    return this.tagsService.getTree();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tag by id' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return the tag',
    type: TagResponseDto,
  })
  findOne(@Param('id') id: string) {
    return this.tagsService.findOne(id);
  }

  @Get(':id/related')
  @ApiOperation({ summary: 'Get related tags and synonyms' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return related tags and synonyms',
    type: Object,
  })
  findRelated(@Param('id') id: string) {
    return this.tagsService.findRelated(id);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update tag' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tag has been updated successfully',
    type: TagResponseDto,
  })
  update(@Param('id') id: string, @Body() updateTagDto: UpdateTagDto, @Request() req) {
    return this.tagsService.update(id, updateTagDto, req.user.id);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete tag' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tag has been deleted successfully',
  })
  remove(@Param('id') id: string) {
    return this.tagsService.remove(id);
  }

  @Post('relations')
  @Roles('admin')
  @ApiOperation({ summary: 'Create a new tag relation' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Tag relation has been created successfully',
    type: TagRelationResponseDto,
  })
  createRelation(@Body() createRelationDto: CreateTagRelationDto, @Request() req) {
    return this.tagsService.createRelation(createRelationDto, req.user.id);
  }

  @Delete('relations/:id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete tag relation' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tag relation has been deleted successfully',
  })
  removeRelation(@Param('id') id: string) {
    return this.tagsService.removeRelation(id);
  }
}
