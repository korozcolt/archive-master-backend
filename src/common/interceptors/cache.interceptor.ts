/* eslint-disable @typescript-eslint/no-unused-vars */
// src/common/interceptors/cache.interceptor.ts

import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable, of } from 'rxjs';

import { CacheManagerService } from '@/config/cache/cache-manager.service';
import { Reflector } from '@nestjs/core';
import { tap } from 'rxjs/operators';

export const CacheKey = (key: string, ttl?: number) => {
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

  constructor(
    private cacheManager: CacheManagerService,
    private reflector: Reflector,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();

    // Obtener metadatos de caché
    const cacheKey = this.reflector.get<string>('cacheKey', handler);
    const ttl = this.reflector.get<number>('cacheTTL', handler);

    if (!cacheKey) {
      return next.handle();
    }

    // Construir clave única considerando parámetros
    const finalKey = this.buildCacheKey(cacheKey, request);

    try {
      // Intentar obtener del caché
      const cachedResponse = await this.cacheManager.get(finalKey);
      if (cachedResponse) {
        return of(cachedResponse);
      }

      // Si no está en caché, ejecutar handler y guardar resultado
      return next.handle().pipe(
        tap(async (response) => {
          await this.cacheManager.set(finalKey, response, { ttl });
        }),
      );
    } catch (error) {
      this.logger.error(`Cache error for key ${finalKey}:`, error);
      return next.handle();
    }
  }

  private buildCacheKey(baseKey: string, request: any): string {
    const parts = [baseKey];

    // Añadir parámetros de ruta
    if (request.params && Object.keys(request.params).length > 0) {
      parts.push(Object.values(request.params).join(':'));
    }

    // Añadir parámetros de query ordenados
    if (request.query && Object.keys(request.query).length > 0) {
      const sortedQuery = Object.keys(request.query)
        .sort()
        .map((key) => `${key}=${request.query[key]}`)
        .join('&');
      parts.push(sortedQuery);
    }

    // Si es una petición autenticada, añadir ID de usuario
    if (request.user?.id) {
      parts.push(`user:${request.user.id}`);
    }

    return parts.join(':');
  }
}
