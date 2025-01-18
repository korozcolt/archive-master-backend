import { CreateWorkflowStepDto } from './create-workflow-step.dto';
import { PartialType } from '@nestjs/swagger';

// src/modules/workflow/dto/workflow-step/update-workflow-step.dto.ts
export class UpdateWorkflowStepDto extends PartialType(CreateWorkflowStepDto) {}
