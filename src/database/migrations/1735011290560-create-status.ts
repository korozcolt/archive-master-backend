// src/database/migrations/[timestamp]-create-status.ts
import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateStatus1735011290560 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear tabla de estados
    await queryRunner.createTable(
      new Table({
        name: 'status',
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
            length: '50',
          },
          {
            name: 'code',
            type: 'varchar',
            length: '50',
            isUnique: true,
            comment: 'Código único para identificar el estado',
          },
          {
            name: 'description',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'color',
            type: 'varchar',
            length: '7',
            default: "'#6B7280'",
            comment: 'Color hexadecimal para UI',
          },
          {
            name: 'icon',
            type: 'varchar',
            length: '50',
            isNullable: true,
            comment: 'Nombre del icono para UI',
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

    // Crear tabla de transiciones de estado
    await queryRunner.createTable(
      new Table({
        name: 'status_transitions',
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
            name: 'from_status_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
            comment: 'Estado origen (null significa cualquier estado)',
          },
          {
            name: 'to_status_id',
            type: 'varchar',
            length: '36',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            comment: 'Nombre de la transición',
          },
          {
            name: 'description',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'requires_comment',
            type: 'boolean',
            default: false,
            comment: 'Indica si la transición requiere un comentario',
          },
          {
            name: 'required_role_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
            comment: 'Rol requerido para realizar la transición',
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

    // Foreign Keys para status_transitions
    await queryRunner.createForeignKey(
      'status_transitions',
      new TableForeignKey({
        name: 'FK_status_transitions_from',
        columnNames: ['from_status_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'status',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'status_transitions',
      new TableForeignKey({
        name: 'FK_status_transitions_to',
        columnNames: ['to_status_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'status',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'status_transitions',
      new TableForeignKey({
        name: 'FK_status_transitions_role',
        columnNames: ['required_role_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'roles',
        onDelete: 'SET NULL',
      }),
    );

    // Foreign Keys para created_by y updated_by en ambas tablas
    ['status', 'status_transitions'].forEach((tableName) => {
      ['created_by', 'updated_by'].forEach((columnName) => {
        queryRunner.createForeignKey(
          tableName,
          new TableForeignKey({
            name: `FK_${tableName}_${columnName}`,
            columnNames: [columnName],
            referencedColumnNames: ['id'],
            referencedTableName: 'users',
            onDelete: 'SET NULL',
          }),
        );
      });
    });
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar foreign keys y tablas en orden inverso
    await queryRunner.dropTable('status_transitions');
    await queryRunner.dropTable('status');
  }
}
