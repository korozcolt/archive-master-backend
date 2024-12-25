// src/modules/status/dto/update-status-transition.dto.ts

import { CreateStatusTransitionDto } from './create-status-transition.dto';
import { PartialType } from '@nestjs/swagger';

export class UpdateStatusTransitionDto extends PartialType(CreateStatusTransitionDto) {}
