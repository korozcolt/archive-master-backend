import { User } from '@/modules/users/entities/user.entity';
import { VersionOperation } from '../enums/version-operation.enum';
import { VersioningService } from '../services/versioning.service';

export function Versionable() {
  return function (target: any) {
    const originalSave = target.prototype.save;

    target.prototype.save = async function (user: User, versioningService?: VersioningService) {
      const isNewEntity = !this.id;

      // Guardar la entidad original
      const result = await originalSave.call(this);

      // Verificar si el servicio de versionamiento está disponible
      if (versioningService) {
        const operation = isNewEntity ? VersionOperation.CREATE : VersionOperation.UPDATE;

        await versioningService.createVersion(result, operation, user);
      }

      return result;
    };
  };
}
