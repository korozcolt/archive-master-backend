// src/modules/workflow/services/workflow.service.ts
import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

// Entidades
import { WorkflowInstance } from '../entities/workflow-instance.entity';
import { WorkflowDefinition } from '../entities/workflow-definition.entity';
import { WorkflowStep } from '../entities/workflow-step.entity';
import { WorkflowTransition } from '../entities/workflow-transition.entity';
import { Document } from '@/modules/documents/entities/document.entity';
import { User } from '@/modules/users/entities/user.entity';

// Enums
import { DocumentStatus } from '@/modules/documents/enums/document-status.enum';

// Servicios relacionados
import { WorkflowValidationService } from './workflow-validation.service';
import { WorkflowEventService, WorkflowEventType } from './workflow-event.service';
import { WorkflowNotificationStrategy } from '../workflow-notification-strategy';

// DTOs y tipos
export interface WorkflowInstanceFilters {
  documentId?: string;
  workflowDefinitionId?: string;
  currentStepId?: string;
}

export interface TransitionOptions {
  comment?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class WorkflowService {
  private readonly logger = new Logger(WorkflowService.name);

  constructor(
    @InjectRepository(WorkflowInstance)
    private workflowInstanceRepository: Repository<WorkflowInstance>,
    @InjectRepository(WorkflowDefinition)
    private workflowDefinitionRepository: Repository<WorkflowDefinition>,
    @InjectRepository(WorkflowStep)
    private workflowStepRepository: Repository<WorkflowStep>,
    @InjectRepository(WorkflowTransition)
    private workflowTransitionRepository: Repository<WorkflowTransition>,
    @InjectRepository(Document)
    private documentRepository: Repository<Document>,
    private dataSource: DataSource,
    private validationService: WorkflowValidationService,
    private notificationStrategy: WorkflowNotificationStrategy,
    private workflowEventService: WorkflowEventService,
  ) {}

  /**
   * Obtener una instancia de workflow por ID con todas sus relaciones
   * @param instanceId Identificador de la instancia de workflow
   */
  async getWorkflowInstance(instanceId: string): Promise<WorkflowInstance> {
    const instance = await this.workflowInstanceRepository.findOne({
      where: { id: instanceId },
      relations: [
        'workflowDefinition',
        'document',
        'currentStep',
        'currentStep.status',
        'currentTask',
        'tasks',
        'workflowDefinition.steps',
        'workflowDefinition.transitions',
      ],
    });

    if (!instance) {
      throw new NotFoundException(`Instancia de workflow con ID ${instanceId} no encontrada`);
    }

    return instance;
  }

  /**
   * Obtener instancias de workflow activas con filtros
   * @param filters Filtros para búsqueda de instancias
   */
  async getActiveWorkflowInstances(filters: WorkflowInstanceFilters): Promise<WorkflowInstance[]> {
    const queryBuilder = this.workflowInstanceRepository
      .createQueryBuilder('instance')
      .leftJoinAndSelect('instance.workflowDefinition', 'definition')
      .leftJoinAndSelect('instance.document', 'document')
      .leftJoinAndSelect('instance.currentStep', 'currentStep')
      .leftJoinAndSelect('currentStep.status', 'stepStatus')
      .leftJoinAndSelect('instance.currentTask', 'currentTask')
      .where('instance.status = :status', { status: 'active' });

    if (filters.documentId) {
      queryBuilder.andWhere('instance.documentId = :documentId', {
        documentId: filters.documentId,
      });
    }

    if (filters.workflowDefinitionId) {
      queryBuilder.andWhere('instance.workflowDefinitionId = :workflowDefinitionId', {
        workflowDefinitionId: filters.workflowDefinitionId,
      });
    }

    if (filters.currentStepId) {
      queryBuilder.andWhere('instance.currentStepId = :currentStepId', {
        currentStepId: filters.currentStepId,
      });
    }

    return queryBuilder.getMany();
  }

  /**
   * Iniciar un nuevo workflow
   * @param documentId ID del documento
   * @param workflowDefinitionId ID de la definición de workflow
   * @param user Usuario que inicia el workflow
   * @param metadata Metadatos adicionales
   */
  async startWorkflow(
    documentId: string,
    workflowDefinitionId: string,
    user: User,
    metadata?: Record<string, any>,
  ): Promise<WorkflowInstance> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Verificar documento
      const document = await this.documentRepository.findOne({
        where: { id: documentId },
      });
      if (!document) {
        throw new NotFoundException('Documento no encontrado');
      }

      // Verificar definición de workflow
      const workflowDefinition = await this.workflowDefinitionRepository.findOne({
        where: { id: workflowDefinitionId, isActive: true },
        relations: ['steps', 'steps.status'],
      });
      if (!workflowDefinition) {
        throw new NotFoundException('Definición de workflow no encontrada o inactiva');
      }

      // Verificar si ya existe un workflow activo para este documento
      const existingActiveWorkflow = await this.workflowInstanceRepository.findOne({
        where: {
          documentId,
          status: 'active',
        },
      });
      if (existingActiveWorkflow) {
        throw new BadRequestException('Ya existe un workflow activo para este documento');
      }

      // Encontrar paso inicial
      const initialStep = workflowDefinition.steps.find(
        (step) => !workflowDefinition.transitions.some((t) => t.toStepId === step.id),
      );
      if (!initialStep) {
        throw new BadRequestException('No se encontró un paso inicial para este workflow');
      }

      // Crear instancia de workflow
      const workflowInstance = this.workflowInstanceRepository.create({
        workflowDefinitionId,
        documentId,
        currentStepId: initialStep.id,
        status: 'active',
        metadata: metadata || {},
        createdById: user.id,
        updatedById: user.id,
      });

      // Guardar instancia
      const savedInstance = await queryRunner.manager.save(workflowInstance);

      // Actualizar estado del documento si es necesario
      document.status = initialStep.status.code as DocumentStatus;
      await queryRunner.manager.save(document);

      // Emitir evento de inicio de workflow
      this.workflowEventService.emit({
        type: WorkflowEventType.WORKFLOW_STARTED,
        workflowInstanceId: savedInstance.id,
        data: {
          instance: savedInstance,
          metadata,
          documentStatus: document.status,
        },
        timestamp: new Date(),
        userId: user.id,
      });

      await queryRunner.commitTransaction();

      // Recargar la instancia con todas las relaciones
      return this.getWorkflowInstance(savedInstance.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Error iniciando workflow', error);

      // Emitir evento de error
      this.workflowEventService.emit({
        type: WorkflowEventType.WORKFLOW_ERROR,
        workflowInstanceId: null,
        data: {
          error: {
            name: 'WorkflowStartError',
            message: error.toString(),
          },
          documentId,
        },
        userId: user.id,
      });

      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Realizar transición de workflow
   * @param instanceId ID de la instancia de workflow
   * @param transitionId ID de la transición
   * @param user Usuario que realiza la transición
   * @param options Opciones adicionales de transición
   */
  async transitionWorkflow(
    instanceId: string,
    transitionId: string,
    user: User,
    options: TransitionOptions = {},
  ): Promise<WorkflowInstance> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Obtener instancia actual
      const instance = await this.getWorkflowInstance(instanceId);

      // Obtener transición
      const transition = await this.workflowTransitionRepository.findOne({
        where: { id: transitionId },
        relations: ['fromStep', 'toStep', 'toStep.status'],
      });

      if (!transition) {
        throw new NotFoundException('Transición no encontrada');
      }

      // Validar transición
      const validationResult = await this.validationService.validateWorkflowTransition(
        instance,
        transition,
        user,
      );

      if (!validationResult.isValid) {
        throw new BadRequestException(validationResult.errors.join(', '));
      }

      // Actualizar estado del documento si es necesario
      const document = await this.documentRepository.findOne({
        where: { id: instance.documentId },
      });

      if (document && transition.toStep.status) {
        document.status = transition.toStep.status.code as DocumentStatus;
        await queryRunner.manager.save(document);
      }

      // Actualizar instancia de workflow
      instance.currentStepId = transition.toStepId;
      instance.metadata = {
        ...instance.metadata,
        ...options.metadata,
      };

      const updatedInstance = await queryRunner.manager.save(instance);

      // Emitir evento de transición
      this.workflowEventService.emit({
        type: WorkflowEventType.WORKFLOW_STEP_CHANGED,
        workflowInstanceId: instanceId,
        data: {
          instance: updatedInstance,
          transition,
          comment: options.comment,
          documentStatus: document?.status,
        },
        timestamp: new Date(),
        userId: user.id,
      });

      await queryRunner.commitTransaction();

      // Recargar instancia con relaciones
      return this.getWorkflowInstance(instanceId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Error en transición de workflow', error);

      // Emitir evento de error
      this.workflowEventService.emit({
        type: WorkflowEventType.WORKFLOW_ERROR,
        workflowInstanceId: null,
        data: {
          error: {
            name: 'WorkflowTransitionError',
            message: error.toString(),
          },
        },
        userId: user.id,
      });

      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Cancelar instancia de workflow
   * @param instanceId ID de la instancia de workflow
   * @param user Usuario que cancela
   * @param reason Razón de la cancelación
   */
  async cancelWorkflow(instanceId: string, user: User, reason: string): Promise<WorkflowInstance> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Obtener instancia actual
      const instance = await this.getWorkflowInstance(instanceId);

      // Verificar estado
      if (instance.status !== 'active') {
        throw new BadRequestException('Solo se pueden cancelar workflows activos');
      }

      // Actualizar estado
      instance.status = 'cancelled';
      instance.metadata = {
        ...instance.metadata,
        cancellationReason: reason,
        cancelledBy: user.id,
        cancelledAt: new Date(),
      };

      const cancelledInstance = await queryRunner.manager.save(instance);

      // Emitir evento de cancelación
      this.workflowEventService.emit({
        type: WorkflowEventType.WORKFLOW_CANCELLED,
        workflowInstanceId: instanceId,
        data: {
          instance: {
            id: cancelledInstance.id,
            documentId: cancelledInstance.documentId,
            status: cancelledInstance.status,
          },
          metadata: {
            cancellationReason: reason,
            cancelledBy: user.id,
          },
        },
        timestamp: new Date(),
        userId: user.id,
      });

      await queryRunner.commitTransaction();

      // Recargar instancia
      return this.getWorkflowInstance(instanceId);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Error cancelando workflow', error);

      // Emitir evento de error
      this.workflowEventService.emit({
        type: WorkflowEventType.WORKFLOW_ERROR,
        workflowInstanceId: instanceId,
        data: {
          error: {
            name: 'WorkflowCancellationError',
            message: error.toString(),
            stack: error.toString(),
          },
          instanceId,
        },
        timestamp: new Date(),
        userId: user.id,
      });

      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
