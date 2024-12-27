// src/modules/workflow/services/workflow-execution.service.ts

import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { WorkflowInstance } from '../entities/workflow-instance.entity';
import { WorkflowTransition } from '../entities/workflow-transition.entity';
import { Document } from '../../documents/entities/document.entity';
import { User } from '../../users/entities/user.entity';
import { WorkflowInstanceResponseDto } from '../dto/workflow-instance/workflow-instance-response.dto';
import { WorkflowDefinitionResponseDto } from '../dto/workflow-definition/workflow-definition-response.dto';
import { DocumentResponseDto } from '../../documents/dto/document-response.dto';
import { WorkflowStepResponseDto } from '../dto/workflow-step/workflow-step-response.dto';
import { DocumentStatus } from '../../documents/enums/document-status.enum';

export interface ExecutionResult {
  success: boolean;
  instance?: WorkflowInstanceResponseDto;
  error?: string;
}

@Injectable()
export class WorkflowExecutionService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(WorkflowInstance)
    private workflowInstanceRepository: Repository<WorkflowInstance>,
    @InjectRepository(WorkflowTransition)
    private workflowTransitionRepository: Repository<WorkflowTransition>,
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
  ) {}

  async executeTransition(
    instanceId: string,
    transitionId: string,
    user: User,
    metadata?: Record<string, any>,
    comment?: string,
  ): Promise<ExecutionResult> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Obtener y validar la instancia
      const instance = await this.workflowInstanceRepository.findOne({
        where: { id: instanceId },
        relations: ['workflowDefinition', 'currentStep', 'document', 'createdBy', 'updatedBy'],
      });

      if (!instance) {
        throw new BadRequestException('Workflow instance not found');
      }

      // 2. Obtener y validar la transición
      const transition = await this.workflowTransitionRepository.findOne({
        where: { id: transitionId },
        relations: ['fromStep', 'toStep', 'toStep.status', 'requiredRole'],
      });

      if (!transition) {
        throw new BadRequestException('Workflow transition not found');
      }

      // 3. Validar el estado actual
      if (instance.currentStepId !== transition.fromStepId) {
        throw new BadRequestException('Invalid transition for current step');
      }

      // 4. Actualizar el documento si es necesario
      if (transition.toStep?.status) {
        const document = await this.documentRepository.findOne({
          where: { id: instance.documentId },
        });

        if (document) {
          document.status = DocumentStatus[transition.toStep.status.code];
          await queryRunner.manager.save(Document, document);
        }
      }

      // 5. Actualizar la instancia del workflow
      const updatedInstance = await queryRunner.manager.save(WorkflowInstance, {
        ...instance,
        currentStepId: transition.toStepId,
        metadata: {
          ...instance.metadata,
          ...metadata,
          lastTransition: {
            fromStepId: transition.fromStepId,
            toStepId: transition.toStepId,
            at: new Date(),
            by: user.id,
            comment,
          },
        },
        updatedById: user.id,
      });

      // 6. Verificar si es el paso final
      const isFinalStep = await this.isFinalStep(
        transition.toStepId,
        instance.workflowDefinitionId,
      );

      if (isFinalStep) {
        updatedInstance.status = 'completed';
        await queryRunner.manager.save(WorkflowInstance, updatedInstance);
      }

      await queryRunner.commitTransaction();

      // Recargar la instancia con todas las relaciones para el mapeo
      const completedInstance = await this.workflowInstanceRepository.findOne({
        where: { id: updatedInstance.id },
        relations: [
          'workflowDefinition',
          'currentStep',
          'document',
          'createdBy',
          'updatedBy',
          'currentStep.status',
          'currentTask',
        ],
      });

      return {
        success: true,
        instance: completedInstance ? this.mapToResponseDto(completedInstance) : undefined,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    } finally {
      await queryRunner.release();
    }
  }

  private async isFinalStep(stepId: string, workflowDefinitionId: string): Promise<boolean> {
    const transitions = await this.workflowTransitionRepository
      .createQueryBuilder('transition')
      .where('transition.workflowDefinitionId = :workflowDefinitionId', { workflowDefinitionId })
      .andWhere('transition.fromStepId = :stepId', { stepId })
      .getCount();

    return transitions === 0;
  }

  private mapToResponseDto(instance: WorkflowInstance): WorkflowInstanceResponseDto {
    const workflowDefinition: WorkflowDefinitionResponseDto = {
      id: instance.workflowDefinition.id,
      name: instance.workflowDefinition.name,
      code: instance.workflowDefinition.code,
      description: instance.workflowDefinition.description,
      isActive: instance.workflowDefinition.isActive,
      steps: [],
      transitions: [],
      createdBy: instance.workflowDefinition.createdBy,
      updatedBy: instance.workflowDefinition.updatedBy,
      createdAt: instance.workflowDefinition.createdAt,
      updatedAt: instance.workflowDefinition.updatedAt,
    };

    const document: DocumentResponseDto = {
      id: instance.document.id,
      title: instance.document.title,
      description: instance.document.description,
      type: instance.document.type,
      status: instance.document.status,
      metadata: instance.document.metadata,
      currentVersionNumber: instance.document.currentVersionNumber,
      createdBy: instance.document.createdBy,
      category: instance.document.category,
      createdAt: instance.document.createdAt,
      updatedAt: instance.document.updatedAt,
    };

    const currentStep: WorkflowStepResponseDto = {
      id: instance.currentStep.id,
      name: instance.currentStep.name,
      description: instance.currentStep.description,
      status: instance.currentStep.status,
      assigneeRole: instance.currentStep.assigneeRole,
      config: instance.currentStep.config,
      isActive: instance.currentStep.isActive,
      createdBy: instance.currentStep.createdBy,
      updatedBy: instance.currentStep.updatedBy,
      createdAt: instance.currentStep.createdAt,
      updatedAt: instance.currentStep.updatedAt,
    };

    return {
      id: instance.id,
      workflowDefinition,
      document,
      currentStep,
      status: instance.status,
      metadata: instance.metadata,
      tasks: instance.tasks,
      createdBy: instance.createdBy,
      updatedBy: instance.updatedBy,
      createdAt: instance.createdAt,
      updatedAt: instance.updatedAt,
      currentTask: instance.currentTask,
    };
  }
}
