import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { VersioningService } from '../services/versioning.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { GetUser } from '@/common/decorators/get-user.decorator';
import { User } from '@/modules/users/entities/user.entity';

@ApiTags('Versions')
@Controller('versions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VersionController {
  constructor(private versioningService: VersioningService) {}

  @Get(':entityId')
  async getVersionHistory(
    @Param('entityId') entityId: string,
    @Query('entityType') entityType: string,
  ) {
    return this.versioningService.getVersionHistory(entityId, entityType);
  }

  @Post('restore/:versionId')
  @Roles('admin')
  async restoreVersion(@Param('versionId') versionId: string, @GetUser() user: User) {
    return this.versioningService.restoreVersion(versionId, user);
  }
}
