import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Version } from './entities/version.entity';
import { VersionController } from './controllers/version.controller';
import { VersioningService } from './services/versioning.service';

@Module({
  imports: [TypeOrmModule.forFeature([Version])],
  providers: [VersioningService],
  controllers: [VersionController],
  exports: [VersioningService],
})
export class VersioningModule {}
