// src/modules/status/dto/update-status.dto.ts

import { CreateStatusDto } from './create-status.dto';
import { PartialType } from '@nestjs/swagger';

export class UpdateStatusDto extends PartialType(CreateStatusDto) {}
