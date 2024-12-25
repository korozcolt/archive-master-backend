import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { ConfigurationGroup } from './configuration-group.entity';
import { ConfigurationHistory } from './configuration-history.entity';
import { User } from '../../users/entities/user.entity';

export enum ConfigurationType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  JSON = 'json',
  ARRAY = 'array',
}

@Entity('configurations')
export class Configuration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'group_id' })
  groupId: string;

  @ManyToOne(() => ConfigurationGroup, (group) => group.configurations)
  @JoinColumn({ name: 'group_id' })
  group: ConfigurationGroup;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 100, unique: true })
  key: string;

  @Column('text')
  value: string;

  @Column({
    type: 'enum',
    enum: ConfigurationType,
    default: ConfigurationType.STRING,
  })
  type: ConfigurationType;

  @Column({ length: 255, nullable: true })
  description: string;

  @Column({ type: 'json', nullable: true })
  validationRules: Record<string, any>;

  @Column({ name: 'is_system', default: false })
  isSystem: boolean;

  @Column({ name: 'is_public', default: false })
  isPublic: boolean;

  @Column({ name: 'is_encrypted', default: false })
  isEncrypted: boolean;

  @OneToMany(() => ConfigurationHistory, (history) => history.configuration)
  history: ConfigurationHistory[];

  @Column({ name: 'created_by', nullable: true })
  createdById: string;

  @Column({ name: 'updated_by', nullable: true })
  updatedById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  createdBy: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'updated_by' })
  updatedBy: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  generateKey() {
    if (this.name && !this.key) {
      this.key = this.name
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '_')
        .replace(/(^_|_$)+/g, '');
    }
  }

  // Método para obtener el valor tipado según el tipo de configuración
  getValue(): any {
    if (this.isEncrypted) {
      // Aquí implementarías la lógica de desencriptación
      return this.value;
    }

    switch (this.type) {
      case ConfigurationType.NUMBER:
        return Number(this.value);
      case ConfigurationType.BOOLEAN:
        return this.value === 'true';
      case ConfigurationType.JSON:
      case ConfigurationType.ARRAY:
        try {
          return JSON.parse(this.value);
        } catch {
          return null;
        }
      default:
        return this.value;
    }
  }

  // Método para establecer el valor asegurando el tipo correcto
  setValue(value: any): void {
    switch (this.type) {
      case ConfigurationType.JSON:
      case ConfigurationType.ARRAY:
        this.value = JSON.stringify(value);
        break;
      default:
        this.value = String(value);
    }
  }
}
