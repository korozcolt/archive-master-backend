// src/database/migrations/[timestamp]-create-configurations.ts
import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateConfigurations1703298000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear tabla de grupos de configuración
    await queryRunner.createTable(
      new Table({
        name: 'configuration_groups',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'code',
            type: 'varchar',
            length: '50',
            isUnique: true,
          },
          {
            name: 'description',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'icon',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'order',
            type: 'int',
            default: 0,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_by',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'updated_by',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Crear tabla de configuraciones
    await queryRunner.createTable(
      new Table({
        name: 'configurations',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'group_id',
            type: 'varchar',
            length: '36',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'key',
            type: 'varchar',
            length: '100',
            isUnique: true,
          },
          {
            name: 'value',
            type: 'text',
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['string', 'number', 'boolean', 'json', 'array'],
            default: "'string'",
          },
          {
            name: 'description',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'validation_rules',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'is_system',
            type: 'boolean',
            default: false,
            comment: 'Indica si es una configuración del sistema',
          },
          {
            name: 'is_public',
            type: 'boolean',
            default: false,
            comment: 'Indica si la configuración es pública',
          },
          {
            name: 'is_encrypted',
            type: 'boolean',
            default: false,
            comment: 'Indica si el valor debe estar encriptado',
          },
          {
            name: 'created_by',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'updated_by',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Crear tabla de historial de configuraciones
    await queryRunner.createTable(
      new Table({
        name: 'configuration_history',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'configuration_id',
            type: 'varchar',
            length: '36',
          },
          {
            name: 'old_value',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'new_value',
            type: 'text',
          },
          {
            name: 'change_notes',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'created_by',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Crear foreign keys
    await queryRunner.createForeignKey(
      'configurations',
      new TableForeignKey({
        name: 'FK_configurations_group',
        columnNames: ['group_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'configuration_groups',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'configuration_history',
      new TableForeignKey({
        name: 'FK_configuration_history_config',
        columnNames: ['configuration_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'configurations',
        onDelete: 'CASCADE',
      }),
    );

    // Foreign keys para created_by y updated_by
    const tables = ['configuration_groups', 'configurations', 'configuration_history'];
    const userForeignKeys = ['created_by', 'updated_by'];

    for (const table of tables) {
      for (const column of userForeignKeys) {
        if (table === 'configuration_history' && column === 'updated_by') continue;

        await queryRunner.createForeignKey(
          table,
          new TableForeignKey({
            name: `FK_${table}_${column}`,
            columnNames: [column],
            referencedColumnNames: ['id'],
            referencedTableName: 'users',
            onDelete: 'SET NULL',
          }),
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('configuration_history');
    await queryRunner.dropTable('configurations');
    await queryRunner.dropTable('configuration_groups');
  }
}
