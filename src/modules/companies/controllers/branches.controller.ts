// src/modules/companies/controllers/branches.controller.ts

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
import { BranchesService } from '../services/branches.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { BranchResponseDto } from '../dto/branch/branch-response.dto';
import { CreateBranchDto } from '../dto/branch/create-branch.dto';
import { UpdateBranchDto } from '../dto/branch/update-branch.dto';

@ApiTags('Branches')
@Controller('branches')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create a new branch' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Branch has been created successfully',
    type: BranchResponseDto,
  })
  create(@Body() createBranchDto: CreateBranchDto, @Request() req) {
    return this.branchesService.create(createBranchDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all branches' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return all branches',
    type: [BranchResponseDto],
  })
  findAll() {
    return this.branchesService.findAll();
  }

  @Get('company/:companyId')
  @ApiOperation({ summary: 'Get branches by company' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return branches for the specified company',
    type: [BranchResponseDto],
  })
  findByCompany(@Param('companyId') companyId: string, @Query('isActive') isActive?: boolean) {
    return this.branchesService.findByCompany(
      companyId,
      isActive !== undefined ? { isActive } : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get branch by id' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return the branch',
    type: BranchResponseDto,
  })
  findOne(@Param('id') id: string) {
    return this.branchesService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update branch' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Branch has been updated successfully',
    type: BranchResponseDto,
  })
  update(@Param('id') id: string, @Body() updateBranchDto: UpdateBranchDto, @Request() req) {
    return this.branchesService.update(id, updateBranchDto, req.user.id);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete branch' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Branch has been deleted successfully',
  })
  remove(@Param('id') id: string) {
    return this.branchesService.remove(id);
  }

  @Patch(':id/toggle-active')
  @Roles('admin')
  @ApiOperation({ summary: 'Toggle branch active status' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Branch status has been toggled successfully',
    type: BranchResponseDto,
  })
  toggleActive(@Param('id') id: string, @Request() req) {
    return this.branchesService.toggleActive(id, req.user.id);
  }
}
