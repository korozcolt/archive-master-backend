import { ConfigurationGroup } from '../entities/configuration-group.entity';
import { ConfigurationType } from '../entities/configuration.entity';

export class ConfigurationResponseDto {
  id: string;
  group: ConfigurationGroup;
  name: string;
  key: string;
  value: string;
  type: ConfigurationType;
  description?: string;
  validationRules?: Record<string, any>;
  isSystem: boolean;
  isPublic: boolean;
  isEncrypted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
