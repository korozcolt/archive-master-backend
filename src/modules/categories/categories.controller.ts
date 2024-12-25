// src/modules/categories/categories.controller.ts
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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryResponseDto } from './dto/category-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create a new category' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Category has been created successfully',
    type: CategoryResponseDto,
  })
  create(@Body() createCategoryDto: CreateCategoryDto, @Request() req) {
    return this.categoriesService.create(createCategoryDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return all categories',
    type: [CategoryResponseDto],
  })
  findAll() {
    return this.categoriesService.findAll();
  }

  @Get('tree')
  @ApiOperation({ summary: 'Get categories tree structure' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return categories in tree structure',
    type: [CategoryResponseDto],
  })
  getTree() {
    return this.categoriesService.getTree();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by id' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return the category',
    type: CategoryResponseDto,
  })
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update category' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Category has been updated successfully',
    type: CategoryResponseDto,
  })
  update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto, @Request() req) {
    return this.categoriesService.update(id, updateCategoryDto, req.user.id);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete category' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Category has been deleted successfully',
  })
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }

  @Patch(':id/reorder')
  @Roles('admin')
  @ApiOperation({ summary: 'Reorder category' })
  reorder(@Param('id') id: string, @Body('order') order: number, @Request() req) {
    return this.categoriesService.reorder(id, order, req.user.id);
  }

  @Patch(':id/toggle-active')
  @Roles('admin')
  @ApiOperation({ summary: 'Toggle category active status' })
  toggleActive(@Param('id') id: string, @Request() req) {
    return this.categoriesService.toggleActive(id, req.user.id);
  }
}
