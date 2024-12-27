// src/modules/workflow/workflow.module.ts

import { AuthModule } from '@/modules/auth/auth.module';
import { ConfigModule } from '@/config/config.module';
import { ConfigurationsModule } from '@/modules/configurations/configurations.module';
import { Document } from '@/modules/documents/entities/document.entity';
import { DocumentsModule } from '@/modules/documents/documents.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Module } from '@nestjs/common';
import { Role } from '../roles/entities/role.entity';
import { RolesModule } from '../roles/roles.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@/modules/users/entities/user.entity';
import { UsersModule } from '@/modules/users/users.module';
import { WorkflowController } from './controllers/workflow.controller';
import { WorkflowDefinition } from './entities/workflow-definition.entity';
import { WorkflowDefinitionController } from './controllers/workflow-definition.controller';
import { WorkflowDefinitionService } from './services/workflow-definition.service';
import { WorkflowEventService } from './services/workflow-event.service';
import { WorkflowInstance } from './entities/workflow-instance.entity';
import { WorkflowNotificationStrategy } from './workflow-notification-strategy';
import { WorkflowService } from './services/workflow.service';
import { WorkflowStep } from './entities/workflow-step.entity';
import { WorkflowTask } from './entities/workflow-task.entity';
import { WorkflowTaskController } from './controllers/workflow-task.controller';
import { WorkflowTaskService } from './services/workflow-task.service';
import { WorkflowTransition } from './entities/workflow-transition.entity';
import { WorkflowValidationService } from './services/workflow-validation.service';

@Module({
  imports: [
    // Importar módulos de documentos y usuarios
    DocumentsModule,
    UsersModule,
    AuthModule,
    ConfigModule,
    ConfigurationsModule,
    RolesModule,

    // Registro de repositorios de TypeORM
    TypeOrmModule.forFeature([
      // Entidades de Workflow
      WorkflowInstance,
      WorkflowDefinition,
      WorkflowStep,
      WorkflowTransition,
      WorkflowTask,

      // Entidades de otros módulos
      Document,
      User,
      Role,
    ]),

    // Módulo de eventos para notificaciones y registro
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
    }),
  ],

  // Controladores del módulo
  controllers: [WorkflowController, WorkflowDefinitionController, WorkflowTaskController],

  // Servicios y proveedores
  providers: [
    WorkflowService,
    WorkflowDefinitionService,
    WorkflowTaskService,
    WorkflowValidationService,
    WorkflowEventService,
    WorkflowNotificationStrategy,
  ],

  // Exportar servicios para uso en otros módulos
  exports: [
    WorkflowService,
    WorkflowDefinitionService,
    WorkflowTaskService,
    WorkflowValidationService,
    WorkflowEventService,
  ],
})
export class WorkflowModule {}
