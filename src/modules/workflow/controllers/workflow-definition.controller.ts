// src/modules/workflow/controllers/workflow-definition.controller.ts
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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { WorkflowDefinitionService } from '../services/workflow-definition.service';
import { CreateWorkflowDefinitionDto } from '../dto/workflow-definition/create-workflow-definition.dto';
import { UpdateWorkflowDefinitionDto } from '../dto/workflow-definition/update-workflow-definition.dto';
import { WorkflowDefinitionResponseDto } from '../dto/workflow-definition/workflow-definition-response.dto';
import { WorkflowDefinition } from '../entities/workflow-definition.entity';

@ApiTags('Workflow Definitions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('workflow-definitions')
export class WorkflowDefinitionController {
  constructor(private readonly workflowDefinitionService: WorkflowDefinitionService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create a new workflow definition' })
  @ApiResponse({
    status: 201,
    description: 'The workflow definition has been successfully created.',
    type: WorkflowDefinitionResponseDto,
  })
  async create(@Body() createDto: CreateWorkflowDefinitionDto, @Request() req) {
    const workflow = await this.workflowDefinitionService.create(createDto, req.user);
    return this.mapToResponseDto(workflow);
  }

  @Get()
  @ApiOperation({ summary: 'Get all workflow definitions' })
  @ApiResponse({
    status: 200,
    description: 'Return all workflow definitions',
    type: [WorkflowDefinitionResponseDto],
  })
  async findAll() {
    const workflows = await this.workflowDefinitionService.findAll();
    return workflows.map((workflow) => this.mapToResponseDto(workflow));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get workflow definition by id' })
  @ApiResponse({
    status: 200,
    description: 'Return the workflow definition',
    type: WorkflowDefinitionResponseDto,
  })
  async findOne(@Param('id') id: string) {
    const workflow = await this.workflowDefinitionService.findOne(id);
    return this.mapToResponseDto(workflow);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update workflow definition' })
  @ApiResponse({
    status: 200,
    description: 'The workflow definition has been successfully updated.',
    type: WorkflowDefinitionResponseDto,
  })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateWorkflowDefinitionDto,
    @Request() req,
  ) {
    const workflow = await this.workflowDefinitionService.update(id, updateDto, req.user);
    return this.mapToResponseDto(workflow);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete workflow definition' })
  @ApiResponse({
    status: 200,
    description: 'The workflow definition has been successfully deleted.',
  })
  remove(@Param('id') id: string) {
    return this.workflowDefinitionService.remove(id);
  }

  private mapToResponseDto(workflow: WorkflowDefinition): WorkflowDefinitionResponseDto {
    return {
      id: workflow.id,
      name: workflow.name,
      code: workflow.code,
      description: workflow.description,
      isActive: workflow.isActive,
      steps: workflow.steps?.map((step) => ({
        id: step.id,
        name: step.name,
        description: step.description,
        status: step.status,
        assigneeRole: step.assigneeRole,
        config: step.config,
        isActive: step.isActive,
        createdAt: step.createdAt,
        updatedAt: step.updatedAt,
      })),
      transitions: workflow.transitions?.map((transition) => ({
        id: transition.id,
        name: transition.name,
        description: transition.description,
        fromStep: transition.fromStep,
        toStep: transition.toStep,
        requiredRole: transition.requiredRole,
        requiresComment: transition.requiresComment,
        conditions: transition.conditions,
        isActive: transition.isActive,
        createdAt: transition.createdAt,
        updatedAt: transition.updatedAt,
      })),
      createdBy: workflow.createdBy,
      updatedBy: workflow.updatedBy,
      createdAt: workflow.createdAt,
      updatedAt: workflow.updatedAt,
    };
  }
}
