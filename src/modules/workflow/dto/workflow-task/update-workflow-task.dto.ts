import { CreateWorkflowTaskDto } from './create-workflow-task.dto';
import { PartialType } from '@nestjs/swagger';

// src/modules/workflow/dto/workflow-task/update-workflow-task.dto.ts
export class UpdateWorkflowTaskDto extends PartialType(CreateWorkflowTaskDto) {}
