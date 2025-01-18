import { CreateWorkflowInstanceDto } from './create-workflow-instance.dto';
import { PartialType } from '@nestjs/swagger';

// src/modules/workflow/dto/workflow-instance/update-workflow-instance.dto.ts
export class UpdateWorkflowInstanceDto extends PartialType(CreateWorkflowInstanceDto) {}
