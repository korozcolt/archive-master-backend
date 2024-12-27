import { CreateWorkflowTransitionDto } from './create-workflow-transition.dto';
import { PartialType } from '@nestjs/swagger';

// src/modules/workflow/dto/workflow-transition/update-workflow-transition.dto.ts
export class UpdateWorkflowTransitionDto extends PartialType(CreateWorkflowTransitionDto) {}
