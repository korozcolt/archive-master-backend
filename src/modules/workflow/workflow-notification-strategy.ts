// src/modules/workflow/services/workflow-notification-strategy.ts

import { Injectable, Logger } from '@nestjs/common';

import { ConfigurationsService } from '@/modules/configurations/configurations.service';
import { User } from '@/modules/users/entities/user.entity';
import { WorkflowInstance } from './entities/workflow-instance.entity';
import { WorkflowTask } from './entities/workflow-task.entity';

export interface NotificationChannels {
  email?: boolean;
  inApp?: boolean;
  sms?: boolean;
}

export interface NotificationPayload {
  title: string;
  message: string;
  recipient: User;
  channels?: NotificationChannels;
  metadata?: Record<string, any>;
}

@Injectable()
export class WorkflowNotificationStrategy {
  private readonly logger = new Logger(WorkflowNotificationStrategy.name);

  constructor(private readonly configurationsService: ConfigurationsService) {}

  /**
   * Determinar canales de notificación según configuración
   */
  private async getNotificationChannels(): Promise<NotificationChannels> {
    try {
      const emailEnabled = await this.configurationsService.getConfigurationValue<boolean>(
        'WORKFLOW_EMAIL_NOTIFICATIONS',
      );
      const inAppEnabled = await this.configurationsService.getConfigurationValue<boolean>(
        'WORKFLOW_INAPP_NOTIFICATIONS',
      );
      const smsEnabled = await this.configurationsService.getConfigurationValue<boolean>(
        'WORKFLOW_SMS_NOTIFICATIONS',
      );

      return {
        email: emailEnabled || false,
        inApp: inAppEnabled || true, // Por defecto activadas
        sms: smsEnabled || false,
      };
    } catch (error) {
      this.logger.warn('No se pudieron recuperar configuraciones de notificación', error);
      return { inApp: true }; // Canal por defecto
    }
  }

  /**
   * Preparar notificación de nueva tarea asignada
   */
  async notifyTaskAssigned(task: WorkflowTask): Promise<void> {
    if (!task.assignee) return;

    const channels = await this.getNotificationChannels();
    const payload: NotificationPayload = {
      title: 'Nueva Tarea de Workflow',
      message: `Se te ha asignado la tarea: ${task.step.name} en el workflow ${task.workflowInstance.workflowDefinition.name}`,
      recipient: task.assignee,
      channels,
      metadata: {
        workflowInstanceId: task.workflowInstanceId,
        taskId: task.id,
        stepName: task.step.name,
      },
    };

    await this.send(payload);
  }

  /**
   * Preparar notificación de cambio de estado de workflow
   */
  async notifyWorkflowStatusChanged(instance: WorkflowInstance): Promise<void> {
    if (!instance.document.createdBy) return;

    const channels = await this.getNotificationChannels();
    const payload: NotificationPayload = {
      title: 'Cambio de Estado de Workflow',
      message: `El documento "${instance.document.title}" ha cambiado al estado: ${instance.currentStep.name}`,
      recipient: instance.document.createdBy,
      channels,
      metadata: {
        workflowInstanceId: instance.id,
        documentId: instance.documentId,
        newStepName: instance.currentStep.name,
      },
    };

    await this.send(payload);
  }

  /**
   * Método de envío de notificación (a implementar según infraestructura)
   */
  private async send(payload: NotificationPayload): Promise<void> {
    try {
      // Implementación pendiente de envío según canales
      if (payload.channels.email) {
        // Envío por email
        this.logger.log(`Email enviado a ${payload.recipient.email}`);
      }

      if (payload.channels.inApp) {
        // Almacenar notificación en base de datos o sistema de notificaciones in-app
        this.logger.log(`Notificación in-app para ${payload.recipient.email}`);
      }

      if (payload.channels.sms) {
        // Envío por SMS (requeriría servicio externo)
        this.logger.log(`SMS enviado a ${payload.recipient.email}`);
      }
    } catch (error) {
      this.logger.error('Error enviando notificación', error);
    }
  }
}
