// src/commands/database.seed.command.ts

import { Command, CommandRunner } from 'nest-commander';

import { DataSource } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { createInitialRoles } from '../database/seeds/role.seed';

@Injectable()
@Command({
  name: 'seed',
  description: 'Seed the database with initial data',
})
export class DatabaseSeedCommand extends CommandRunner {
  constructor(private dataSource: DataSource) {
    super();
  }

  async run(): Promise<void> {
    try {
      console.log('Starting database seed...');

      await createInitialRoles(this.dataSource);

      console.log('Database seed completed successfully!');
    } catch (error) {
      console.error('Error seeding database:', error);
      throw error;
    } finally {
      await this.dataSource.destroy();
    }
  }
}
