// src/modules/companies/controllers/companies.controller.ts

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
import { CompaniesService } from '../services/companies.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CompanyResponseDto } from '../dto/company/company-response.dto';
import { CreateCompanyDto } from '../dto/company/create-company.dto';
import { UpdateCompanyDto } from '../dto/company/update-company.dto';

@ApiTags('Companies')
@Controller('companies')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create a new company' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Company has been created successfully',
    type: CompanyResponseDto,
  })
  create(@Body() createCompanyDto: CreateCompanyDto, @Request() req) {
    return this.companiesService.create(createCompanyDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all companies' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return all companies',
    type: [CompanyResponseDto],
  })
  findAll(@Query('isActive') isActive?: boolean) {
    return this.companiesService.findAllWithFilters(
      isActive !== undefined ? { isActive } : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get company by id' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return the company',
    type: CompanyResponseDto,
  })
  findOne(@Param('id') id: string) {
    return this.companiesService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update company' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Company has been updated successfully',
    type: CompanyResponseDto,
  })
  update(@Param('id') id: string, @Body() updateCompanyDto: UpdateCompanyDto, @Request() req) {
    return this.companiesService.update(id, updateCompanyDto, req.user.id);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete company' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Company has been deleted successfully',
  })
  remove(@Param('id') id: string) {
    return this.companiesService.remove(id);
  }

  @Patch(':id/toggle-active')
  @Roles('admin')
  @ApiOperation({ summary: 'Toggle company active status' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Company status has been toggled successfully',
    type: CompanyResponseDto,
  })
  toggleActive(@Param('id') id: string, @Request() req) {
    return this.companiesService.toggleActive(id, req.user.id);
  }
}
