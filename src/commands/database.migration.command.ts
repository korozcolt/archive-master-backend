// src/commands/database.migration.command.ts

import * as fs from 'fs';
import * as path from 'path';

import { Command, CommandRunner } from 'nest-commander';

import { DataSource } from 'typeorm';
import { Injectable } from '@nestjs/common';

@Injectable()
@Command({
  name: 'migration',
  description: 'Database migration commands',
})
export class DatabaseMigrationCommand extends CommandRunner {
  constructor(private dataSource: DataSource) {
    super();
  }

  async run(passedParams: string[]): Promise<void> {
    const command = passedParams[0];

    try {
      switch (command) {
        case 'create':
          await this.createMigration(passedParams[1]);
          break;
        case 'up':
          await this.runMigrations();
          break;
        case 'down':
          await this.revertLastMigration();
          break;
        case 'refresh':
          await this.refreshDatabase();
          break;
        default:
          console.log('Available commands: create, up, down, refresh');
      }
    } catch (error) {
      console.error('Error executing migration command:', error);
      throw error;
    } finally {
      if (this.dataSource.isInitialized) {
        await this.dataSource.destroy();
      }
    }
  }

  private async createMigration(name: string): Promise<void> {
    if (!name) {
      console.error('Please provide a migration name');
      return;
    }

    const timestamp = new Date().getTime();
    const className = this.toPascalCase(name);
    const fileName = `${timestamp}-${name}`;

    const template = `import { MigrationInterface, QueryRunner } from 'typeorm';

export class ${className}${timestamp} implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Write your migration code here
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Write your rollback code here
  }
}`;

    const migrationsDir = path.join(
      process.cwd(),
      'src',
      'database',
      'migrations',
    );

    // Asegurarse de que el directorio existe
    if (!fs.existsSync(migrationsDir)) {
      fs.mkdirSync(migrationsDir, { recursive: true });
    }

    const migrationPath = path.join(migrationsDir, `${fileName}.ts`);
    fs.writeFileSync(migrationPath, template);
    console.log(
      `Migration ${fileName} created successfully at ${migrationPath}`,
    );
  }

  private async runMigrations(): Promise<void> {
    try {
      console.log('Running migrations...');
      const migrations = await this.dataSource.runMigrations({
        transaction: 'each',
      });
      console.log(`Successfully ran ${migrations.length} migrations`);
      migrations.forEach((migration) => {
        console.log(`- ${migration.name}`);
      });
    } catch (error) {
      console.error('Error running migrations:', error);
      throw error;
    }
  }

  private async revertLastMigration(): Promise<void> {
    await this.dataSource.undoLastMigration({ transaction: 'each' });
    console.log('Last migration reverted successfully');
  }

  private async refreshDatabase(): Promise<void> {
    try {
      await this.dataSource.dropDatabase();
      console.log('Database dropped successfully');

      await this.dataSource.runMigrations({ transaction: 'each' });
      console.log('Database refreshed successfully');
    } catch (error) {
      console.error('Error refreshing database:', error);
      throw error;
    }
  }

  private toPascalCase(str: string): string {
    return str
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }
}
