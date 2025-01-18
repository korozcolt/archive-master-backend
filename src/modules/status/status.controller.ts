// src/modules/status/status.controller.ts
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
import { StatusService } from './status.service';
import { CreateStatusDto } from './dto/create-status.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { CreateStatusTransitionDto } from './dto/create-status-transition.dto';
import { UpdateStatusTransitionDto } from './dto/update-status-transition.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Status')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('status')
export class StatusController {
  constructor(private readonly statusService: StatusService) {}

  // Status Endpoints
  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create a new status' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The status has been successfully created.',
  })
  createStatus(@Body() createStatusDto: CreateStatusDto, @Request() req) {
    return this.statusService.createStatus(createStatusDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all statuses' })
  findAllStatus() {
    return this.statusService.findAllStatus();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a status by id' })
  findOneStatus(@Param('id') id: string) {
    return this.statusService.findOneStatus(id);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update a status' })
  updateStatus(@Param('id') id: string, @Body() updateStatusDto: UpdateStatusDto, @Request() req) {
    return this.statusService.updateStatus(id, updateStatusDto, req.user.id);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a status' })
  removeStatus(@Param('id') id: string) {
    return this.statusService.removeStatus(id);
  }

  // Status Transitions Endpoints
  @Post('transitions')
  @Roles('admin')
  @ApiOperation({ summary: 'Create a new status transition' })
  createTransition(@Body() createTransitionDto: CreateStatusTransitionDto, @Request() req) {
    return this.statusService.createTransition(createTransitionDto, req.user.id);
  }

  @Get('transitions')
  @ApiOperation({ summary: 'Get all status transitions' })
  findAllTransitions() {
    return this.statusService.findAllTransitions();
  }

  @Get('transitions/:id')
  @ApiOperation({ summary: 'Get a status transition by id' })
  findOneTransition(@Param('id') id: string) {
    return this.statusService.findOneTransition(id);
  }

  @Patch('transitions/:id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update a status transition' })
  updateTransition(
    @Param('id') id: string,
    @Body() updateTransitionDto: UpdateStatusTransitionDto,
    @Request() req,
  ) {
    return this.statusService.updateTransition(id, updateTransitionDto, req.user.id);
  }

  @Delete('transitions/:id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a status transition' })
  removeTransition(@Param('id') id: string) {
    return this.statusService.removeTransition(id);
  }

  @Get(':statusId/available-transitions')
  @ApiOperation({ summary: 'Get available transitions for a status' })
  getAvailableTransitions(@Param('statusId') statusId: string, @Request() req) {
    return this.statusService.getAvailableTransitions(statusId, req.user.role);
  }
}
