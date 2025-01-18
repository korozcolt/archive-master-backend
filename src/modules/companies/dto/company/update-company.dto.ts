// src/modules/companies/dto/update-company.dto.ts

import { CreateCompanyDto } from './create-company.dto';
import { PartialType } from '@nestjs/swagger';

export class UpdateCompanyDto extends PartialType(CreateCompanyDto) {}
