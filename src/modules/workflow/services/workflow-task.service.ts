// src/modules/workflow/services/workflow-task.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { WorkflowTask } from '../entities/workflow-task.entity';
import { WorkflowInstance } from '../entities/workflow-instance.entity';
import { WorkflowStep } from '../entities/workflow-step.entity';
import { User } from '../../users/entities/user.entity';
import { Role } from '../../roles/entities/role.entity';

interface TaskCreationData {
  workflowInstanceId: string;
  stepId: string;
  assigneeRoleId?: string;
  assigneeId?: string;
  dueDate?: Date;
  metadata?: Record<string, any>;
}

interface TaskCompletionData {
  comment?: string;
  metadata?: Record<string, any>;
}

interface TaskQueryFilters {
  status?: string[];
  assigneeId?: string;
  assigneeRoleId?: string;
  stepId?: string;
  workflowInstanceId?: string;
  dueDateBefore?: Date;
  dueDateAfter?: Date;
}

@Injectable()
export class WorkflowTaskService {
  constructor(
    @InjectRepository(WorkflowTask)
    private workflowTaskRepository: Repository<WorkflowTask>,
    @InjectRepository(WorkflowInstance)
    private workflowInstanceRepository: Repository<WorkflowInstance>,
    @InjectRepository(WorkflowStep)
    private workflowStepRepository: Repository<WorkflowStep>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    private dataSource: DataSource,
  ) {}

  async createTask(taskData: TaskCreationData, user: User): Promise<WorkflowTask> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Validar instancia de workflow
      const instance = await this.workflowInstanceRepository.findOne({
        where: { id: taskData.workflowInstanceId },
      });
      if (!instance) {
        throw new NotFoundException('Workflow instance not found');
      }

      // Validar paso del workflow
      const step = await this.workflowStepRepository.findOne({
        where: { id: taskData.stepId },
      });
      if (!step) {
        throw new NotFoundException('Workflow step not found');
      }

      // Validar rol asignado si existe
      if (taskData.assigneeRoleId) {
        const role = await this.roleRepository.findOne({
          where: { id: taskData.assigneeRoleId },
        });
        if (!role) {
          throw new NotFoundException('Assignee role not found');
        }
      }

      // Crear la tarea
      const task = this.workflowTaskRepository.create({
        workflowInstanceId: taskData.workflowInstanceId,
        stepId: taskData.stepId,
        assigneeRoleId: taskData.assigneeRoleId,
        assigneeId: taskData.assigneeId,
        status: 'pending',
        dueDate: taskData.dueDate,
        metadata: taskData.metadata || {},
        createdById: user.id,
        updatedById: user.id,
      });

      const savedTask = await queryRunner.manager.save(task);

      // Actualizar la instancia con la nueva tarea
      await queryRunner.manager.update(WorkflowInstance, instance.id, {
        currentTaskId: savedTask.id,
        updatedById: user.id,
      });

      await queryRunner.commitTransaction();

      return this.getTaskById(savedTask.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getTaskById(taskId: string): Promise<WorkflowTask> {
    const task = await this.workflowTaskRepository.findOne({
      where: { id: taskId },
      relations: ['workflowInstance', 'step', 'assigneeRole', 'assignee', 'createdBy', 'updatedBy'],
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    return task;
  }

  async getCurrentTask(workflowInstanceId: string): Promise<WorkflowTask> {
    const instance = await this.workflowInstanceRepository.findOne({
      where: { id: workflowInstanceId },
      relations: ['currentTask'],
    });

    if (!instance || !instance.currentTask) {
      throw new NotFoundException('No active task found for this workflow instance');
    }

    return this.getTaskById(instance.currentTask.id);
  }

  async completeCurrentTask(
    workflowInstanceId: string,
    user: User,
    data: TaskCompletionData,
  ): Promise<WorkflowTask> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const task = await this.getCurrentTask(workflowInstanceId);

      // Validaciones de permisos
      await this.validateTaskPermissions(task, user);

      // Actualizar la tarea
      const updatedTask = await queryRunner.manager.save(WorkflowTask, {
        ...task,
        status: 'completed',
        comments: data.comment,
        metadata: {
          ...task.metadata,
          ...data.metadata,
          completedAt: new Date(),
        },
        updatedById: user.id,
      });

      // Limpiar la tarea actual de la instancia
      await queryRunner.manager.update(WorkflowInstance, workflowInstanceId, {
        currentTaskId: null,
        updatedById: user.id,
      });

      await queryRunner.commitTransaction();

      return this.getTaskById(updatedTask.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async assignTask(taskId: string, assigneeId: string, user: User): Promise<WorkflowTask> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const task = await this.getTaskById(taskId);

      if (task.status !== 'pending') {
        throw new BadRequestException('Only pending tasks can be assigned');
      }

      // Validar que el usuario asignado tiene el rol requerido si existe
      if (task.assigneeRoleId) {
        const hasRole = await this.validateUserRole(assigneeId, task.assigneeRoleId);
        if (!hasRole) {
          throw new BadRequestException('Assignee does not have the required role');
        }
      }

      const updatedTask = await queryRunner.manager.save(WorkflowTask, {
        ...task,
        assigneeId,
        status: 'in_progress',
        updatedById: user.id,
        metadata: {
          ...task.metadata,
          assignedAt: new Date(),
          assignedBy: user.id,
        },
      });

      await queryRunner.commitTransaction();

      return this.getTaskById(updatedTask.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async cancelTask(taskId: string, user: User, reason: string): Promise<WorkflowTask> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const task = await this.getTaskById(taskId);

      if (!['pending', 'in_progress'].includes(task.status)) {
        throw new BadRequestException('Only pending or in-progress tasks can be cancelled');
      }

      await this.validateTaskPermissions(task, user);

      const updatedTask = await queryRunner.manager.save(WorkflowTask, {
        ...task,
        status: 'cancelled',
        comments: reason,
        updatedById: user.id,
        metadata: {
          ...task.metadata,
          cancelledAt: new Date(),
          cancelledBy: user.id,
          cancellationReason: reason,
        },
      });

      // Si es la tarea actual de la instancia, limpiarla
      if (task.workflowInstance.currentTaskId === task.id) {
        await queryRunner.manager.update(WorkflowInstance, task.workflowInstanceId, {
          currentTaskId: null,
          updatedById: user.id,
        });
      }

      await queryRunner.commitTransaction();

      return this.getTaskById(updatedTask.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findTasks(filters: TaskQueryFilters): Promise<WorkflowTask[]> {
    const queryBuilder = this.workflowTaskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.workflowInstance', 'instance')
      .leftJoinAndSelect('task.step', 'step')
      .leftJoinAndSelect('task.assigneeRole', 'assigneeRole')
      .leftJoinAndSelect('task.assignee', 'assignee');

    if (filters.status?.length) {
      queryBuilder.andWhere('task.status IN (:...status)', { status: filters.status });
    }

    if (filters.assigneeId) {
      queryBuilder.andWhere('task.assigneeId = :assigneeId', { assigneeId: filters.assigneeId });
    }

    if (filters.assigneeRoleId) {
      queryBuilder.andWhere('task.assigneeRoleId = :assigneeRoleId', {
        assigneeRoleId: filters.assigneeRoleId,
      });
    }

    if (filters.stepId) {
      queryBuilder.andWhere('task.stepId = :stepId', { stepId: filters.stepId });
    }

    if (filters.workflowInstanceId) {
      queryBuilder.andWhere('task.workflowInstanceId = :workflowInstanceId', {
        workflowInstanceId: filters.workflowInstanceId,
      });
    }

    if (filters.dueDateBefore) {
      queryBuilder.andWhere('task.dueDate <= :dueDateBefore', {
        dueDateBefore: filters.dueDateBefore,
      });
    }

    if (filters.dueDateAfter) {
      queryBuilder.andWhere('task.dueDate >= :dueDateAfter', {
        dueDateAfter: filters.dueDateAfter,
      });
    }

    return queryBuilder.getMany();
  }

  private async validateTaskPermissions(task: WorkflowTask, user: User): Promise<void> {
    if (task.assigneeId && task.assigneeId !== user.id) {
      const isAdmin = user.role?.name === 'admin';
      if (!isAdmin) {
        throw new BadRequestException('Only assigned user can modify this task');
      }
    }

    if (task.assigneeRoleId) {
      const hasRole = await this.validateUserRole(user.id, task.assigneeRoleId);
      if (!hasRole) {
        throw new BadRequestException('User does not have required role for this task');
      }
    }
  }

  private async validateUserRole(userId: string, roleId: string): Promise<boolean> {
    const user = await this.dataSource.getRepository(User).findOne({
      where: { id: userId },
      relations: ['role', 'role.permissions'],
    });

    return (
      user?.role?.id === roleId || user?.role?.permissions.some((p) => p.id === roleId) || false
    );
  }
}
