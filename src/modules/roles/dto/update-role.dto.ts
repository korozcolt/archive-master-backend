// src/modules/roles/dto/update-role.dto.ts

import { CreateRoleDto } from './create-role.dto';
import { PartialType } from '@nestjs/swagger';

export class UpdateRoleDto extends PartialType(CreateRoleDto) {}
