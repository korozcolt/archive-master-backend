/* eslint-disable @typescript-eslint/no-require-imports */

import * as path from 'path';

import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';
import { register } from 'tsconfig-paths';

// Registrar los alias de TypeScript
const tsConfig = require('./tsconfig.json');
const baseUrl = path.join(__dirname); // directorio raíz del proyecto

register({
  baseUrl,
  paths: tsConfig.compilerOptions.paths,
});

config(); // Cargar variables de entorno

export default new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'archive_master',
  entities: [join(__dirname, 'src', '**', '*.entity{.ts,.js}')],
  migrations: [join(__dirname, 'src', 'database', 'migrations', '*{.ts,.js}')],
  synchronize: false,
  logging: process.env.NODE_ENV !== 'production',
});
