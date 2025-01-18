import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';

import { Type } from 'class-transformer';

export class BulkUpdateConfigurationItemDto {
  @ApiProperty({ description: 'Configuration ID' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'New value for the configuration' })
  @IsString()
  value: string;

  @ApiPropertyOptional({ description: 'Notes about the change' })
  @IsString()
  @IsOptional()
  changeNotes?: string;
}

export class BulkUpdateConfigurationsDto {
  @ApiProperty({
    type: [BulkUpdateConfigurationItemDto],
    description: 'Array of configurations to update',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkUpdateConfigurationItemDto)
  configurations: BulkUpdateConfigurationItemDto[];
}
