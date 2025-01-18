// src/modules/status/status.module.ts

import { Module } from '@nestjs/common';
import { Status } from './entities/status.entity';
import { StatusController } from './status.controller';
import { StatusService } from './status.service';
import { StatusTransition } from './entities/status-transition.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Status, StatusTransition])],
  controllers: [StatusController],
  providers: [StatusService],
  exports: [StatusService],
})
export class StatusModule {}
