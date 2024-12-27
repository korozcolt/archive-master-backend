// src/modules/workflow/controllers/workflow.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { WorkflowService } from '../services/workflow.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import {
  CancelWorkflowDto,
  StartWorkflowDto,
  TransitionWorkflowDto,
} from '../dto/start-workflow.dto';
import { WorkflowInstanceResponseDto } from '../dto/workflow-instance/workflow-instance-response.dto';
import { WorkflowDefinitionResponseDto } from '../dto/workflow-definition/workflow-definition-response.dto';
import { WorkflowStepResponseDto } from '../dto/workflow-step/workflow-step-response.dto';
import { DocumentResponseDto } from '@/modules/documents/dto/document-response.dto';
import { WorkflowTaskResponseDto } from '../dto/workflow-task/workflow-task-response.dto';
import { WorkflowInstance } from '../entities/workflow-instance.entity';
import { UserResponseDto } from '@/modules/users/dto/user-response.dto';

@ApiTags('Workflow')
@Controller('workflow')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Post('start')
  @ApiOperation({ summary: 'Start a new workflow instance' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Workflow instance created successfully',
    type: WorkflowInstanceResponseDto,
  })
  async startWorkflow(
    @Body() startWorkflowDto: StartWorkflowDto,
    @Request() req,
  ): Promise<WorkflowInstanceResponseDto> {
    const instance = await this.workflowService.startWorkflow(
      startWorkflowDto.documentId,
      startWorkflowDto.workflowDefinitionId,
      req.user,
      startWorkflowDto.metadata,
    );
    return this.mapToResponseDto(instance);
  }

  @Get('instance/:id')
  @ApiOperation({ summary: 'Get workflow instance by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return workflow instance details',
    type: WorkflowInstanceResponseDto,
  })
  async getInstance(@Param('id') id: string): Promise<WorkflowInstanceResponseDto> {
    const instance = await this.workflowService.getWorkflowInstance(id);
    return this.mapToResponseDto(instance);
  }

  @Get('instances')
  @ApiOperation({ summary: 'Get active workflow instances with filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return list of active workflow instances',
    type: [WorkflowInstanceResponseDto],
  })
  async getActiveInstances(
    @Query('documentId') documentId?: string,
    @Query('workflowDefinitionId') workflowDefinitionId?: string,
    @Query('currentStepId') currentStepId?: string,
  ): Promise<WorkflowInstanceResponseDto[]> {
    const instances = await this.workflowService.getActiveWorkflowInstances({
      documentId,
      workflowDefinitionId,
      currentStepId,
    });
    return instances.map((instance) => this.mapToResponseDto(instance));
  }

  @Patch('instance/:id/transition')
  @ApiOperation({ summary: 'Transition workflow instance to next step' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Workflow transitioned successfully',
    type: WorkflowInstanceResponseDto,
  })
  async transitionWorkflow(
    @Param('id') id: string,
    @Body() transitionDto: TransitionWorkflowDto,
    @Request() req,
  ): Promise<WorkflowInstanceResponseDto> {
    const instance = await this.workflowService.transitionWorkflow(
      id,
      transitionDto.transitionId,
      req.user,
      {
        comment: transitionDto.comment,
        metadata: transitionDto.metadata,
      },
    );
    return this.mapToResponseDto(instance);
  }

  @Patch('instance/:id/cancel')
  @ApiOperation({ summary: 'Cancel workflow instance' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Workflow cancelled successfully',
    type: WorkflowInstanceResponseDto,
  })
  async cancelWorkflow(
    @Param('id') id: string,
    @Body() cancelDto: CancelWorkflowDto,
    @Request() req,
  ): Promise<WorkflowInstanceResponseDto> {
    const instance = await this.workflowService.cancelWorkflow(id, req.user, cancelDto.reason);
    return this.mapToResponseDto(instance);
  }

  /**
   * Mapeo detallado para cumplir con WorkflowInstanceResponseDto
   */
  private mapToResponseDto(instance: WorkflowInstance): WorkflowInstanceResponseDto {
    // Mapeo de WorkflowDefinition con valores predeterminados
    const workflowDefinition: WorkflowDefinitionResponseDto = {
      id: instance.workflowDefinition?.id || '',
      name: instance.workflowDefinition?.name || '',
      code: instance.workflowDefinition?.code || '',
      description: instance.workflowDefinition?.description || '',
      isActive: instance.workflowDefinition?.isActive || false,
      steps: instance.workflowDefinition?.steps || [],
      transitions: instance.workflowDefinition?.transitions || [],
      createdBy: instance.workflowDefinition?.createdBy || null,
      updatedBy: instance.workflowDefinition?.updatedBy || null,
      createdAt: instance.workflowDefinition?.createdAt || new Date(),
      updatedAt: instance.workflowDefinition?.updatedAt || new Date(),
    };

    // Mapeo de CurrentStep con valores predeterminados
    const currentStep: WorkflowStepResponseDto = {
      id: instance.currentStep?.id || '',
      name: instance.currentStep?.name || '',
      description: instance.currentStep?.description || '',
      status: instance.currentStep?.status || null,
      assigneeRole: instance.currentStep?.assigneeRole || null,
      config: instance.currentStep?.config || {},
      isActive: instance.currentStep?.isActive || false,
      createdBy: instance.currentStep?.createdBy || null,
      updatedBy: instance.currentStep?.updatedBy || null,
      createdAt: instance.currentStep?.createdAt || new Date(),
      updatedAt: instance.currentStep?.updatedAt || new Date(),
    };

    // Mapeo de Documento con valores predeterminados
    const document: DocumentResponseDto = {
      id: instance.document?.id || '',
      title: instance.document?.title || '',
      description: instance.document?.description || '',
      type: instance.document?.type || null,
      status: instance.document?.status || null,
      metadata: instance.document?.metadata || {},
      currentVersionNumber: instance.document?.currentVersionNumber || 1,
      createdBy: instance.document?.createdBy || null,
      category: instance.document?.category || null,
      createdAt: instance.document?.createdAt || new Date(),
      updatedAt: instance.document?.updatedAt || new Date(),
    };

    // Mapeo de CurrentTask con valores predeterminados
    const currentTask: WorkflowTaskResponseDto | undefined = instance.currentTask
      ? {
          id: instance.currentTask.id || '',
          workflowInstance: {
            id: instance.id || '',
            workflowDefinition,
            document,
            currentStep,
            status: instance.status || '',
            metadata: instance.metadata || {},
            tasks: instance.tasks || [],
            createdBy: instance.createdBy || null,
            updatedBy: instance.updatedBy || null,
            createdAt: instance.createdAt || new Date(),
            updatedAt: instance.updatedAt || new Date(),
            currentTask: null, // Evitar recursión infinita
          },
          step: {
            id: instance.currentTask.step?.id || '',
            name: instance.currentTask.step?.name || '',
            description: instance.currentTask.step?.description || '',
            status: instance.currentTask.step?.status || null,
            assigneeRole: instance.currentTask.step?.assigneeRole || null,
            config: instance.currentTask.step?.config || {},
            isActive: instance.currentTask.step?.isActive || false,
            createdBy: instance.currentTask.step?.createdBy || null,
            updatedBy: instance.currentTask.step?.updatedBy || null,
            createdAt: instance.currentTask.step?.createdAt || new Date(),
            updatedAt: instance.currentTask.step?.updatedAt || new Date(),
          },
          status: instance.currentTask.status || 'pending',
          assignee: instance.currentTask.assignee
            ? UserResponseDto.create(instance.currentTask.assignee)
            : undefined,
          dueDate: instance.currentTask.dueDate || undefined,
          comments: instance.currentTask.comments || undefined,
          metadata: instance.currentTask.metadata || {},
          createdBy: instance.currentTask.createdBy || null,
          updatedBy: instance.currentTask.updatedBy || null,
          createdAt: instance.currentTask.createdAt || new Date(),
          updatedAt: instance.currentTask.updatedAt || new Date(),
        }
      : undefined;

    return {
      id: instance.id || '',
      workflowDefinition,
      document,
      currentStep,
      status: instance.status || '',
      metadata: instance.metadata || {},
      tasks: instance.tasks || [],
      createdBy: instance.createdBy || null,
      updatedBy: instance.updatedBy || null,
      createdAt: instance.createdAt || new Date(),
      updatedAt: instance.updatedAt || new Date(),
      currentTask,
    };
  }
}
