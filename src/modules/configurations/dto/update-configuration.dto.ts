import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

import { CreateConfigurationDto } from './create-configuration.dto';

export class UpdateConfigurationDto extends PartialType(
  OmitType(CreateConfigurationDto, ['groupId'] as const),
) {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  changeNotes?: string;
}
