// src/modules/workflow/controllers/workflow-task.controller.ts
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
import { WorkflowTaskService } from '../services/workflow-task.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { CreateWorkflowTaskDto } from '../dto/workflow-task/create-workflow-task.dto';
import { WorkflowTaskResponseDto } from '../dto/workflow-task/workflow-task-response.dto';
import { WorkflowTask } from '../entities/workflow-task.entity';
import { WorkflowInstanceResponseDto } from '../dto/workflow-instance/workflow-instance-response.dto';
import { WorkflowStepResponseDto } from '../dto/workflow-step/workflow-step-response.dto';
import { RoleResponseDto } from '@/modules/roles/dto/role-response.dto';
import { UserResponseDto } from '@/modules/users/dto/user-response.dto';

@ApiTags('Workflow Tasks')
@Controller('workflow-tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class WorkflowTaskController {
  constructor(private readonly workflowTaskService: WorkflowTaskService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new workflow task' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Task created successfully',
    type: WorkflowTaskResponseDto,
  })
  async createTask(@Body() createTaskDto: CreateWorkflowTaskDto, @Request() req) {
    const task = await this.workflowTaskService.createTask(createTaskDto, req.user);
    return this.mapToResponseDto(task);
  }

  @Get()
  @ApiOperation({ summary: 'Get workflow tasks with filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return filtered tasks',
    type: [WorkflowTaskResponseDto],
  })
  async getTasks(
    @Query('status') status?: string[],
    @Query('assigneeId') assigneeId?: string,
    @Query('assigneeRoleId') assigneeRoleId?: string,
    @Query('stepId') stepId?: string,
    @Query('workflowInstanceId') workflowInstanceId?: string,
    @Query('dueDateBefore') dueDateBefore?: Date,
    @Query('dueDateAfter') dueDateAfter?: Date,
  ) {
    const tasks = await this.workflowTaskService.findTasks({
      status,
      assigneeId,
      assigneeRoleId,
      stepId,
      workflowInstanceId,
      dueDateBefore,
      dueDateAfter,
    });
    return tasks.map((task) => this.mapToResponseDto(task));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get workflow task by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return task details',
    type: WorkflowTaskResponseDto,
  })
  async getTask(@Param('id') taskId: string) {
    const task = await this.workflowTaskService.getTaskById(taskId);
    return this.mapToResponseDto(task);
  }

  @Patch(':id/assign')
  @ApiOperation({ summary: 'Assign task to user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Task assigned successfully',
    type: WorkflowTaskResponseDto,
  })
  async assignTask(
    @Param('id') taskId: string,
    @Body('assigneeId') assigneeId: string,
    @Request() req,
  ) {
    const task = await this.workflowTaskService.assignTask(taskId, assigneeId, req.user);
    return this.mapToResponseDto(task);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Complete a task' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Task completed successfully',
    type: WorkflowTaskResponseDto,
  })
  async completeTask(
    @Param('id') taskId: string,
    @Body() completionData: { comment?: string; metadata?: Record<string, any> },
    @Request() req,
  ) {
    // Primero obtenemos la instancia del workflow
    const task = await this.workflowTaskService.getTaskById(taskId);
    const updatedTask = await this.workflowTaskService.completeCurrentTask(
      task.workflowInstanceId,
      req.user,
      completionData,
    );
    return this.mapToResponseDto(updatedTask);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel a task' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Task cancelled successfully',
    type: WorkflowTaskResponseDto,
  })
  async cancelTask(@Param('id') taskId: string, @Body('reason') reason: string, @Request() req) {
    const task = await this.workflowTaskService.cancelTask(taskId, req.user, reason);
    return this.mapToResponseDto(task);
  }

  private mapToResponseDto(task: WorkflowTask): WorkflowTaskResponseDto {
    const workflowInstance: WorkflowInstanceResponseDto = {
      id: task.workflowInstance.id,
      workflowDefinition: {
        id: task.workflowInstance.workflowDefinition.id,
        name: task.workflowInstance.workflowDefinition.name,
        code: task.workflowInstance.workflowDefinition.code,
        description: task.workflowInstance.workflowDefinition.description,
        isActive: task.workflowInstance.workflowDefinition.isActive,
        steps: [],
        transitions: [],
        createdBy: task.workflowInstance.workflowDefinition.createdBy,
        updatedBy: task.workflowInstance.workflowDefinition.updatedBy,
        createdAt: task.workflowInstance.workflowDefinition.createdAt,
        updatedAt: task.workflowInstance.workflowDefinition.updatedAt,
      },
      document: {
        id: task.workflowInstance.document.id,
        title: task.workflowInstance.document.title,
        description: task.workflowInstance.document.description,
        type: task.workflowInstance.document.type,
        status: task.workflowInstance.document.status,
        metadata: task.workflowInstance.document.metadata,
        currentVersionNumber: task.workflowInstance.document.currentVersionNumber,
        createdBy: task.workflowInstance.document.createdBy,
        category: task.workflowInstance.document.category,
        createdAt: task.workflowInstance.document.createdAt,
        updatedAt: task.workflowInstance.document.updatedAt,
      },
      currentStep: {
        id: task.workflowInstance.currentStep.id,
        name: task.workflowInstance.currentStep.name,
        description: task.workflowInstance.currentStep.description,
        status: task.workflowInstance.currentStep.status,
        assigneeRole: task.workflowInstance.currentStep.assigneeRole,
        config: task.workflowInstance.currentStep.config,
        isActive: task.workflowInstance.currentStep.isActive,
        createdBy: task.workflowInstance.currentStep.createdBy,
        updatedBy: task.workflowInstance.currentStep.updatedBy,
        createdAt: task.workflowInstance.currentStep.createdAt,
        updatedAt: task.workflowInstance.currentStep.updatedAt,
      },
      status: task.workflowInstance.status,
      metadata: task.workflowInstance.metadata,
      tasks: task.workflowInstance.tasks,
      createdBy: task.workflowInstance.createdBy,
      updatedBy: task.workflowInstance.updatedBy,
      createdAt: task.workflowInstance.createdAt,
      updatedAt: task.workflowInstance.updatedAt,
      currentTask: task.workflowInstance.currentTask,
    };

    const step: WorkflowStepResponseDto = {
      id: task.step.id,
      name: task.step.name,
      description: task.step.description,
      status: task.step.status,
      assigneeRole: task.step.assigneeRole,
      config: task.step.config,
      isActive: task.step.isActive,
      createdBy: task.step.createdBy,
      updatedBy: task.step.updatedBy,
      createdAt: task.step.createdAt,
      updatedAt: task.step.updatedAt,
    };

    const assigneeRole: RoleResponseDto | undefined = task.assigneeRole
      ? {
          id: task.assigneeRole.id,
          name: task.assigneeRole.name,
          description: task.assigneeRole.description,
          isActive: task.assigneeRole.isActive,
          createdAt: task.assigneeRole.createdAt,
          updatedAt: task.assigneeRole.updatedAt,
        }
      : undefined;

    const assignee: UserResponseDto | undefined = task.assignee
      ? new UserResponseDto({
          id: task.assignee.id,
          email: task.assignee.email,
          firstName: task.assignee.firstName,
          lastName: task.assignee.lastName,
          isActive: task.assignee.isActive,
          role: task.assignee.role,
          lastLogin: task.assignee.lastLogin,
          createdAt: task.assignee.createdAt,
          updatedAt: task.assignee.updatedAt,
        })
      : undefined;

    return {
      id: task.id,
      workflowInstance,
      step,
      assigneeRole,
      assignee,
      status: task.status,
      comments: task.comments,
      dueDate: task.dueDate,
      metadata: task.metadata,
      createdBy: task.createdBy,
      updatedBy: task.updatedBy,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  }
}
