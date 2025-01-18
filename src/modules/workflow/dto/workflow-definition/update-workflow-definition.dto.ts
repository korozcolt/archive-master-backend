import { CreateWorkflowDefinitionDto } from './create-workflow-definition.dto';
import { PartialType } from '@nestjs/swagger';

// src/modules/workflow/dto/workflow-definition/update-workflow-definition.dto.ts
export class UpdateWorkflowDefinitionDto extends PartialType(CreateWorkflowDefinitionDto) {}
