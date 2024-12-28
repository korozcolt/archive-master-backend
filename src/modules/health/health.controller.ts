// src/modules/health/health.controller.ts

import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';

import { CacheHealthIndicator } from '@/common/health/cache.health';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private cache: CacheHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Check system health' })
  check() {
    return this.health.check([
      // Verifica la conexión a la base de datos
      () => this.db.pingCheck('database'),
      // Verifica el estado del caché
      () => this.cache.check('redis'),
    ]);
  }
}
