// src/common/interceptors/cache.interceptor.ts

import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable, of } from 'rxjs';

import { CACHE_CONFIG } from '@/common/constants/cache.constants';
import { CacheManagerService } from '@/config/redis/cache-manager.service';
import { Reflector } from '@nestjs/core';
import { tap } from 'rxjs/operators';

// Decorator para clave de caché
export const CacheKey = (key: string, ttl?: number) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata('cacheKey', key, target, propertyKey);
    if (ttl) {
      Reflect.defineMetadata('cacheTTL', ttl, target, propertyKey);
    }
  };
};

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);
  private readonly DEFAULT_TTL = CACHE_CONFIG.DOCUMENTS.DEFAULT_TTL;

  constructor(
    private readonly cacheManager: CacheManagerService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    try {
      const request = context.switchToHttp().getRequest();
      const handler = context.getHandler();

      // Obtener metadatos de caché
      const cacheKey = this.reflector.get<string>('cacheKey', handler);
      const ttl = this.reflector.get<number>('cacheTTL', handler) || this.DEFAULT_TTL;

      // Si no hay clave de caché definida, continuar sin caché
      if (!cacheKey) {
        return next.handle();
      }

      // Construir clave única
      const finalKey = this.buildCacheKey(cacheKey, request);

      // Intentar obtener respuesta cacheada
      const cachedResponse = await this.cacheManager.get(finalKey);
      if (cachedResponse !== null) {
        this.logger.debug(`Cache hit for key: ${finalKey}`);
        return of(cachedResponse);
      }

      // Si no hay respuesta cacheada, ejecutar handler y guardar resultado
      return next.handle().pipe(
        tap(async (response) => {
          try {
            await this.cacheManager.set(finalKey, response, { ttl });
            this.logger.debug(`Cache set for key: ${finalKey}`);
          } catch (error) {
            this.logger.error(`Error setting cache for key ${finalKey}:`, error);
          }
        }),
      );
    } catch (error) {
      this.logger.error('Cache interceptor error:', error);
      return next.handle();
    }
  }

  private buildCacheKey(baseKey: string, request: any): string {
    try {
      const parts = [baseKey];

      // Añadir parámetros de ruta
      if (request.params && Object.keys(request.params).length > 0) {
        const paramValues = Object.values(request.params)
          .map((value) => String(value))
          .join(':');
        parts.push(`params:${paramValues}`);
      }

      // Añadir parámetros de query ordenados
      if (request.query && Object.keys(request.query).length > 0) {
        const sortedQuery = Object.entries(request.query)
          .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
          .map(([key, value]) => `${key}=${value}`)
          .join('&');
        parts.push(`query:${sortedQuery}`);
      }

      // Añadir ID de usuario si existe
      if (request.user?.id) {
        parts.push(`user:${request.user.id}`);
      }

      return parts.join(':');
    } catch (error) {
      this.logger.error('Error building cache key:', error);
      return baseKey;
    }
  }
}
