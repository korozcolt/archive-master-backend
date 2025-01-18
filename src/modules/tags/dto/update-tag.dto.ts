// src/modules/tags/dto/update-tag.dto.ts

import { CreateTagDto } from './create-tag.dto';
import { PartialType } from '@nestjs/swagger';

export class UpdateTagDto extends PartialType(CreateTagDto) {}
