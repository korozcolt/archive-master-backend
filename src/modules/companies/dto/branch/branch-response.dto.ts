import { CompanyResponseDto } from '../company/company-response.dto';

export class BranchResponseDto {
  id: string;
  company: CompanyResponseDto;
  name: string;
  code: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  isActive: boolean;
  isMain: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
