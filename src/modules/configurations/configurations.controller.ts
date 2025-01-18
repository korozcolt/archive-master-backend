// src/modules/configurations/configurations.controller.ts
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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ConfigurationsService } from './configurations.service';
import { CreateConfigurationGroupDto } from './dto/create-configuration-group.dto';
import { UpdateConfigurationGroupDto } from './dto/update-configuration-group.dto';
import { CreateConfigurationDto } from './dto/create-configuration.dto';
import { UpdateConfigurationDto } from './dto/update-configuration.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { BulkUpdateConfigurationsDto } from './dto/bulk-update-configurations.dto';

@ApiTags('Configurations')
@Controller('configurations')
export class ConfigurationsController {
  constructor(private readonly configurationsService: ConfigurationsService) {}

  // Endpoints públicos
  @Get('public')
  @ApiOperation({ summary: 'Get public configurations' })
  findPublicConfigurations() {
    return this.configurationsService.findPublicConfigurations();
  }

  // Endpoints protegidos
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('groups')
  @Roles('admin')
  @ApiOperation({ summary: 'Create a new configuration group' })
  createGroup(@Body() createGroupDto: CreateConfigurationGroupDto, @Request() req) {
    return this.configurationsService.createGroup(createGroupDto, req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('groups')
  @ApiOperation({ summary: 'Get all configuration groups' })
  findAllGroups() {
    return this.configurationsService.findAllGroups();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('groups/:id')
  @ApiOperation({ summary: 'Get configuration group by id' })
  findOneGroup(@Param('id') id: string) {
    return this.configurationsService.findOneGroup(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('groups/:id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update configuration group' })
  updateGroup(
    @Param('id') id: string,
    @Body() updateGroupDto: UpdateConfigurationGroupDto,
    @Request() req,
  ) {
    return this.configurationsService.updateGroup(id, updateGroupDto, req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete('groups/:id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete configuration group' })
  removeGroup(@Param('id') id: string) {
    return this.configurationsService.removeGroup(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create a new configuration' })
  create(@Body() createConfigDto: CreateConfigurationDto, @Request() req) {
    return this.configurationsService.createConfiguration(createConfigDto, req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'Get all configurations' })
  findAll(@Query('groupId') groupId?: string) {
    return this.configurationsService.findAllConfigurations(groupId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Get configuration by id' })
  findOne(@Param('id') id: string) {
    return this.configurationsService.findOneConfiguration(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id/history')
  @ApiOperation({ summary: 'Get configuration history' })
  getHistory(@Param('id') id: string) {
    return this.configurationsService.getConfigurationHistory(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update configuration' })
  update(@Param('id') id: string, @Body() updateConfigDto: UpdateConfigurationDto, @Request() req) {
    return this.configurationsService.updateConfiguration(id, updateConfigDto, req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('bulk-update')
  @Roles('admin')
  @ApiOperation({ summary: 'Bulk update configurations' })
  bulkUpdate(@Body() bulkUpdateDto: BulkUpdateConfigurationsDto, @Request() req) {
    return this.configurationsService.bulkUpdate(bulkUpdateDto, req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete configuration' })
  remove(@Param('id') id: string) {
    return this.configurationsService.removeConfiguration(id);
  }
}
