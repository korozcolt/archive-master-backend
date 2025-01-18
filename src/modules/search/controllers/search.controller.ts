// src/modules/search/controllers/search.controller.ts

import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  HttpStatus,
  UseInterceptors,
  UnprocessableEntityException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SearchService } from '../services/search.service';
import { SearchQueryDto } from '../dto/search-query.dto';
import { SearchResultDto } from '../dto/search-result.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { CacheInterceptor } from '@/common/interceptors/cache.interceptor';

@ApiTags('Search')
@Controller('search')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SearchController {
  private readonly logger = new Logger(SearchController.name);

  constructor(private readonly searchService: SearchService) {}

  @Get()
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({ summary: 'Búsqueda avanzada de documentos' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Resultados de búsqueda',
    type: SearchResultDto,
  })
  async search(@Query() query: SearchQueryDto): Promise<SearchResultDto> {
    try {
      const result = await this.searchService.search(query.query, {
        type: query.type,
        categoryIds: query.categoryIds,
        fromDate: query.fromDate ? new Date(query.fromDate) : undefined,
        toDate: query.toDate ? new Date(query.toDate) : undefined,
        page: query.page,
        limit: query.limit,
        metadata: query.metadata,
      });

      // Log de búsquedas para análisis
      this.logger.debug(
        `Búsqueda realizada: ${JSON.stringify({
          query: query.query,
          filters: {
            type: query.type,
            categories: query.categoryIds?.length,
            dateRange: query.fromDate && query.toDate ? 'yes' : 'no',
          },
          results: result.total,
        })}`,
      );

      return result;
    } catch (error) {
      this.logger.error(`Error en búsqueda: ${error}`, error);
      throw new UnprocessableEntityException('Error procesando la búsqueda');
    }
  }

  @Get('suggest')
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({ summary: 'Obtener sugerencias de búsqueda' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sugerencias de búsqueda',
    type: [String],
  })
  async suggest(@Query('q') query: string): Promise<string[]> {
    try {
      return await this.searchService.suggestSearchTerms(query);
    } catch (error) {
      this.logger.error(`Error en sugerencias: ${error}`, error);
      return [];
    }
  }

  @Get('facets')
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({ summary: 'Obtener facetas para filtrado' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Facetas disponibles',
  })
  async getFacets(@Query() query: SearchQueryDto) {
    try {
      const facets = await this.searchService.getFacets(query);
      return {
        types: facets.types,
        categories: facets.categories,
        status: facets.status,
        dateRanges: facets.dateRanges,
      };
    } catch (error) {
      this.logger.error(`Error obteniendo facetas: ${error}`, error);
      throw new UnprocessableEntityException('Error procesando facetas');
    }
  }

  @Get('stats')
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({ summary: 'Obtener estadísticas de búsqueda' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Estadísticas de búsqueda',
  })
  async getStats() {
    try {
      return await this.searchService.getSearchStats();
    } catch (error) {
      this.logger.error(`Error obteniendo estadísticas: ${error}`, error);
      throw new UnprocessableEntityException('Error procesando estadísticas');
    }
  }

  @Post('reindex')
  @Roles('admin')
  @ApiOperation({ summary: 'Reindexar documentos para búsqueda' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reindexación completada',
  })
  async reindex(): Promise<void> {
    try {
      await this.searchService.reindexDocuments();
    } catch (error) {
      this.logger.error(`Error en reindexación: ${error}`, error);
      throw new UnprocessableEntityException('Error en proceso de reindexación');
    }
  }
}
