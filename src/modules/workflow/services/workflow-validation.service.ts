// src/modules/workflow/services/workflow-validation.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkflowDefinition } from '../entities/workflow-definition.entity';
import { WorkflowStep } from '../entities/workflow-step.entity';
import { WorkflowTransition } from '../entities/workflow-transition.entity';
import { WorkflowInstance } from '../entities/workflow-instance.entity';
import { User } from '@/modules/users/entities/user.entity';

export interface WorkflowValidationResult {
  isValid: boolean;
  errors: string[];
}

@Injectable()
export class WorkflowValidationService {
  private readonly logger = new Logger(WorkflowValidationService.name);

  constructor(
    @InjectRepository(WorkflowDefinition)
    private workflowDefinitionRepository: Repository<WorkflowDefinition>,
    @InjectRepository(WorkflowStep)
    private workflowStepRepository: Repository<WorkflowStep>,
    @InjectRepository(WorkflowTransition)
    private workflowTransitionRepository: Repository<WorkflowTransition>,
    @InjectRepository(WorkflowInstance)
    private workflowInstanceRepository: Repository<WorkflowInstance>,
  ) {}

  /**
   * Validar definición de workflow completa
   */
  async validateWorkflowDefinition(
    definition: Partial<WorkflowDefinition>,
    user: User,
  ): Promise<WorkflowValidationResult> {
    const errors: string[] = [];

    // Validar nombre único
    const existingDefinition = await this.workflowDefinitionRepository.findOne({
      where: { code: definition.code },
    });
    if (existingDefinition) {
      errors.push('Ya existe un workflow con este código');
    }

    // Validar pasos
    if (!definition.steps || definition.steps.length === 0) {
      errors.push('El workflow debe tener al menos un paso');
    }

    // Validar transiciones
    if (!definition.transitions || definition.transitions.length === 0) {
      errors.push('El workflow debe tener al menos una transición');
    }

    // Validar permisos de usuario
    if (!this.hasWorkflowCreationPermission(user)) {
      errors.push('No tiene permisos para crear workflows');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validar transición de workflow
   */
  async validateWorkflowTransition(
    currentInstance: WorkflowInstance,
    proposedTransition: WorkflowTransition,
    user: User,
  ): Promise<WorkflowValidationResult> {
    const errors: string[] = [];

    // Validar estado actual
    if (currentInstance.status !== 'active') {
      errors.push('Solo se pueden realizar transiciones en workflows activos');
    }

    // Validar paso actual
    if (proposedTransition.fromStepId !== currentInstance.currentStepId) {
      errors.push('Transición inválida para el paso actual');
    }

    // Validar permisos de rol
    if (proposedTransition.requiredRoleId) {
      const hasRequiredRole = await this.checkUserRole(user, proposedTransition.requiredRoleId);
      if (!hasRequiredRole) {
        errors.push('No tiene el rol requerido para esta transición');
      }
    }

    // Validar condiciones adicionales
    if (proposedTransition.conditions) {
      const conditionErrors = await this.validateTransitionConditions(
        currentInstance,
        proposedTransition.conditions,
      );
      errors.push(...conditionErrors);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Verificar permisos de usuario para creación de workflow
   */
  private hasWorkflowCreationPermission(user: User): boolean {
    // Lógica de permisos basada en roles
    return (
      user.role?.name === 'admin' ||
      user.role?.permissions.some((p) => p.name === 'manage_workflow')
    );
  }

  /**
   * Verificar rol de usuario
   */
  private async checkUserRole(user: User, requiredRoleId: string): Promise<boolean> {
    // Verificar si el usuario tiene el rol requerido
    return (
      user.role?.id === requiredRoleId ||
      user.role?.permissions.some((p) => p.id === requiredRoleId)
    );
  }

  /**
   * Validar condiciones específicas de transición
   */
  private async validateTransitionConditions(
    instance: WorkflowInstance,
    conditions: Record<string, any>,
  ): Promise<string[]> {
    const errors: string[] = [];

    // Ejemplo de validaciones de condiciones
    for (const [key, value] of Object.entries(conditions)) {
      switch (key) {
        case 'requiredMetadata':
          const missingMetadata = (value as string[]).filter(
            (field) => !instance.metadata?.[field],
          );
          if (missingMetadata.length > 0) {
            errors.push(`Metadatos requeridos faltantes: ${missingMetadata.join(', ')}`);
          }
          break;

        case 'documentStatus':
          if (instance.document.status !== value) {
            errors.push(`El estado del documento debe ser: ${value}`);
          }
          break;

        // Añadir más validaciones de condiciones según necesidad
      }
    }

    return errors;
  }
}
