import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { UserResponseDto } from '../../users/dto/user-response.dto';

export class DocumentVersionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  versionNumber: number;

  @ApiProperty()
  content: string;

  @ApiPropertyOptional()
  changes?: Record<string, any>;

  @ApiPropertyOptional()
  createdBy?: UserResponseDto;

  @ApiProperty()
  createdAt: Date;
}
