import { CreateConfigurationGroupDto } from './create-configuration-group.dto';
import { PartialType } from '@nestjs/swagger';

export class UpdateConfigurationGroupDto extends PartialType(CreateConfigurationGroupDto) {}
