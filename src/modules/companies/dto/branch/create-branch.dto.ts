import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateBranchDto {
  @ApiProperty()
  @IsUUID()
  companyId: string;

  @ApiProperty({ example: 'Sede Norte' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'SEDE-NORTE' })
  @IsString()
  code: string;

  @ApiPropertyOptional({ example: 'sede.norte@acme.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '+57 300 123 4567' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'Calle 123 #45-67' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'Bogotá' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: 'Cundinamarca' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ example: 'Colombia' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({ example: '110111' })
  @IsString()
  @IsOptional()
  postalCode?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isMain?: boolean;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
