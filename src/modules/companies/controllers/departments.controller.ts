// src/modules/companies/controllers/departments.controller.ts

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
  Query,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { DepartmentsService } from '../services/departments.service';
import { DepartmentResponseDto } from '../dto/department/department-response.dto';
import { CreateDepartmentDto } from '../dto/department/create-department.dto';
import { UpdateDepartmentDto } from '../dto/department/update-department.dto';

@ApiTags('Departments')
@Controller('departments')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create a new department' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Department has been created successfully',
    type: DepartmentResponseDto,
  })
  create(@Body() createDepartmentDto: CreateDepartmentDto, @Request() req) {
    return this.departmentsService.create(createDepartmentDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all departments' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return all departments',
    type: [DepartmentResponseDto],
  })
  findAll() {
    return this.departmentsService.findAll();
  }

  @Get('branch/:branchId')
  @ApiOperation({ summary: 'Get departments by branch' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return departments for the specified branch',
    type: [DepartmentResponseDto],
  })
  findByBranch(@Param('branchId') branchId: string, @Query('isActive') isActive?: boolean) {
    return this.departmentsService.findByBranch(
      branchId,
      isActive !== undefined ? { isActive } : undefined,
    );
  }

  @Get('branch/:branchId/tree')
  @ApiOperation({ summary: 'Get department tree for branch' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return department hierarchy for the specified branch',
    type: [DepartmentResponseDto],
  })
  getTree(
    @Param('branchId') branchId: string,
    @Query('includeInactive') includeInactive?: boolean,
  ) {
    return this.departmentsService.getDepartmentTree(branchId, includeInactive);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get department by id' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return the department',
    type: DepartmentResponseDto,
  })
  findOne(@Param('id') id: string) {
    return this.departmentsService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update department' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Department has been updated successfully',
    type: DepartmentResponseDto,
  })
  update(
    @Param('id') id: string,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
    @Request() req,
  ) {
    return this.departmentsService.update(id, updateDepartmentDto, req.user.id);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete department' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Department has been deleted successfully',
  })
  remove(@Param('id') id: string) {
    return this.departmentsService.remove(id);
  }

  @Patch(':id/toggle-active')
  @Roles('admin')
  @ApiOperation({ summary: 'Toggle department active status' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Department status has been toggled successfully',
    type: DepartmentResponseDto,
  })
  toggleActive(@Param('id') id: string, @Request() req) {
    return this.departmentsService.toggleActive(id, req.user.id);
  }
}
