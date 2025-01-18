// src/commands/commands.module.ts

import { ConfigModule } from '../config/config.module';
import { DatabaseMigrationCommand } from './database.migration.command';
import { DatabaseModule } from '../config/database/database.module';
import { DatabaseSeedCommand } from './database.seed.command';
import { Module } from '@nestjs/common';

@Module({
  imports: [ConfigModule, DatabaseModule],
  providers: [DatabaseMigrationCommand, DatabaseSeedCommand],
})
export class CommandsModule {}
