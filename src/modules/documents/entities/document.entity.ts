import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Repository,
  UpdateDateColumn,
} from 'typeorm';

import { Category } from '../../categories/entities/category.entity';
import { DocumentStatus } from '../enums/document-status.enum';
import { DocumentType } from '../enums/document-type.enum';
import { DocumentVersion } from './document-version.entity';
import { User } from '../../users/entities/user.entity';
import { VersionOperation } from '@/common/versioning/enums/version-operation.enum';
import { Versionable } from '@/common/versioning/decorators/versionable.decorator';
import { VersioningService } from '@/common/versioning/services/versioning.service';

@Entity('documents')
@Versionable()
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text', { nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: DocumentType,
    default: DocumentType.OTHER,
  })
  type: DocumentType;

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  @OneToMany(() => DocumentVersion, (version) => version.document, {
    cascade: true,
  })
  versions: DocumentVersion[];

  @Column({ nullable: true })
  currentVersionNumber: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by_id' })
  createdBy: User;

  @ManyToOne(() => Category, { nullable: true })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({
    type: 'enum',
    enum: DocumentStatus,
    default: DocumentStatus.DRAFT,
  })
  status: DocumentStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Método de guardado personalizado
  async save(
    user: User,
    repository: Repository<Document>,
    versioningService?: VersioningService,
  ): Promise<Document> {
    // Lógica personalizada de guardado si es necesario
    // Por ejemplo, crear una nueva versión de documento
    if (this.versions && this.versions.length > 0) {
      const latestVersion = this.versions[this.versions.length - 1];
      this.currentVersionNumber = latestVersion.versionNumber + 1;
    } else {
      this.currentVersionNumber = 1;
    }

    // Guardar utilizando el repositorio
    const savedDocument = await repository.save(this);

    // Versionar si el servicio está disponible
    if (versioningService) {
      const operation = this.id ? VersionOperation.UPDATE : VersionOperation.CREATE;

      await versioningService.createVersion(savedDocument, operation, user);
    }

    return savedDocument;
  }
}
