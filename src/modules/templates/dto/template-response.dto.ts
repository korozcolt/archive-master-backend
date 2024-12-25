// src/modules/templates/dto/template-response.dto.ts

import { Category } from '../../categories/entities/category.entity';
import { FieldSchema } from './field-schema.dto';
import { Status } from '../../status/entities/status.entity';

export class TemplateResponseDto {
  id: string;
  name: string;
  code: string;
  description?: string;
  category?: Category;
  initialStatus?: Status;
  metadataSchema: Record<string, any>;
  fieldsSchema: FieldSchema[];
  validationRules?: Record<string, any>;
  requiredFields?: string[];
  defaultValues?: Record<string, any>;
  isActive: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}
