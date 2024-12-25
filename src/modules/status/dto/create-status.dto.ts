import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsHexColor, IsOptional, IsString } from 'class-validator';

export class CreateStatusDto {
  @ApiProperty({ example: 'Draft' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'DRAFT' })
  @IsString()
  code: string;

  @ApiPropertyOptional({ example: 'Document is in draft state' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: '#6B7280' })
  @IsHexColor()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({ example: 'edit' })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
