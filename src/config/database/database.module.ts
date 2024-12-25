// src/config/database/database.module.ts

import { ConfigModule, ConfigService } from '@nestjs/config';

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import databaseConfig from './database.config';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forFeature(databaseConfig),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.database'),
        entities: [join(__dirname, '/../../**/*.entity{.ts,.js}')],
        migrations: [join(__dirname, '/../../database/migrations/*{.ts,.js}')],
        migrationsRun: false, // No ejecutar migraciones automáticamente
        migrationsTableName: 'migrations',
        synchronize: false, // Importante: mantener en false para producción
        logging: configService.get('database.logging'),
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
