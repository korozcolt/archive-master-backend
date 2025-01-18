/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Version } from '../entities/version.entity';
import { VersionOperation } from '../enums/version-operation.enum';
import { User } from '@/modules/users/entities/user.entity';

@Injectable()
export class VersioningService {
  constructor(
    @InjectRepository(Version)
    private versionRepository: Repository<Version>,
    private dataSource: DataSource,
  ) {}

  async createVersion<T>(entity: T, operation: VersionOperation, user: User): Promise<Version> {
    const version = new Version();
    version.entityId = entity['id'];
    version.entityType = entity.constructor.name;
    version.content = this.serializeEntity(entity);
    version.operation = operation;
    version.createdBy = user;

    // Determinar número de versión
    const latestVersion = await this.versionRepository.findOne({
      where: {
        entityId: entity['id'],
        entityType: entity.constructor.name,
      },
      order: { versionNumber: 'DESC' },
    });

    version.versionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;

    return this.versionRepository.save(version);
  }

  private serializeEntity(entity: any): Record<string, any> {
    // Serialización profunda, manejando relaciones
    const serialized = { ...entity };

    // Eliminar referencias circulares
    Object.keys(serialized).forEach((key) => {
      if (serialized[key] instanceof Object) {
        serialized[key] = this.serializeEntity(serialized[key]);
      }
    });

    return serialized;
  }

  async getVersionHistory<T>(entityId: string, entityType: string): Promise<Version[]> {
    return this.versionRepository.find({
      where: {
        entityId,
        entityType,
      },
      order: {
        versionNumber: 'DESC',
      },
      relations: ['createdBy'],
    });
  }

  async restoreVersion(versionId: string, user: User) {
    const version = await this.versionRepository.findOneOrFail({
      where: { id: versionId },
    });

    // Lógica de restauración según el tipo de entidad
    const repository = this.dataSource.getRepository(version.entityType);
    const entity = await repository.findOneOrFail({
      where: { id: version.entityId },
    });

    // Restaurar contenido
    Object.assign(entity, version.content);

    // Crear nueva versión de restauración
    await this.createVersion(entity, VersionOperation.RESTORE, user);

    return repository.save(entity);
  }
}
