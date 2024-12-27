// src/modules/workflow/services/workflow-event.service.ts

import { Injectable, Logger } from '@nestjs/common';

import { DocumentStatus } from '@/modules/documents/enums/document-status.enum';
import { EventEmitter2 } from '@nestjs/event-emitter';

export enum WorkflowEventType {
  WORKFLOW_CREATED = 'workflow.created',
  WORKFLOW_STARTED = 'workflow.started',
  WORKFLOW_STEP_CHANGED = 'workflow.step.changed',
  WORKFLOW_TASK_ASSIGNED = 'workflow.task.assigned',
  WORKFLOW_COMPLETED = 'workflow.completed',
  WORKFLOW_CANCELLED = 'workflow.cancelled',
  WORKFLOW_ERROR = 'workflow.error',
}

export interface WorkflowError {
  name: string;
  message: string;
  stack?: string;
}

export interface WorkflowEventData {
  instance?: any;
  transition?: any;
  task?: any;
  error?: WorkflowError;
  comment?: string;
  metadata?: Record<string, any>;
  documentStatus?: DocumentStatus;
  documentId?: string;
  instanceId?: string;
  [key: string]: any;
}

export interface WorkflowEvent {
  type: WorkflowEventType;
  workflowInstanceId: string | null;
  data: WorkflowEventData;
  timestamp: Date;
  userId?: string;
}

@Injectable()
export class WorkflowEventService {
  private readonly logger = new Logger(WorkflowEventService.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  /**
   * Normalizar error a una estructura consistente
   * @param error Error a normalizar
   */
  private normalizeError(error: unknown): WorkflowError {
    // Para instancias de Error
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    // Para objetos con estructura de error
    if (error && typeof error === 'object') {
      const errorObj = error as {
        name?: string;
        message?: string;
        stack?: string;
        toString?(): string;
      };

      return {
        name: errorObj.name || 'UnknownError',
        message: errorObj.message || (errorObj.toString ? errorObj.toString() : String(error)),
        stack: (errorObj as Error).stack,
      };
    }

    // Manejar primitivos o valores no-objeto
    return {
      name: 'UnknownError',
      message: error ? String(error) : 'Unknown error occurred',
    };
  }

  /**
   * Emitir un evento de workflow
   * @param event Evento de workflow a emitir
   */
  emit(event: Omit<WorkflowEvent, 'timestamp'> & { timestamp?: Date }): void {
    try {
      // Añadir timestamp si no existe
      const fullEvent: WorkflowEvent = {
        ...event,
        timestamp: event.timestamp || new Date(),
      };

      // Normalizar el error si existe
      if (fullEvent.data.error) {
        fullEvent.data.error = this.normalizeError(fullEvent.data.error);
      }

      // Emitir evento
      this.eventEmitter.emit(fullEvent.type, fullEvent);

      // Log del evento
      this.logger.log(
        `Workflow Event: ${fullEvent.type} for Instance ${fullEvent.workflowInstanceId}`,
      );
    } catch (error) {
      this.logger.error(`Error emitting workflow event: ${error}`);
    }
  }

  // Resto de los métodos permanecen igual
  on(eventType: WorkflowEventType, handler: (event: WorkflowEvent) => void): void {
    this.eventEmitter.on(eventType, handler);
    this.logger.log(`Registered listener for event: ${eventType}`);
  }

  once(eventType: WorkflowEventType, handler: (event: WorkflowEvent) => void): void {
    this.eventEmitter.once(eventType, handler);
    this.logger.log(`Registered one-time listener for event: ${eventType}`);
  }

  removeAllListeners(eventType: WorkflowEventType): void {
    this.eventEmitter.removeAllListeners(eventType);
    this.logger.log(`Removed all listeners for event: ${eventType}`);
  }
}
