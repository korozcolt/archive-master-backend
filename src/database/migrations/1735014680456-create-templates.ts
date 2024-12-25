// src/database/migrations/[timestamp]-create-templates.ts
import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateTemplates1703297000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear tabla de templates
    await queryRunner.createTable(
      new Table({
        name: 'templates',
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
            name: 'category_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
            comment: 'Categoría por defecto para documentos de esta plantilla',
          },
          {
            name: 'initial_status_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
            comment: 'Estado inicial para documentos de esta plantilla',
          },
          {
            name: 'metadata_schema',
            type: 'json',
            comment: 'Esquema JSON para validación de metadatos',
          },
          {
            name: 'fields_schema',
            type: 'json',
            comment: 'Esquema JSON para campos personalizados',
          },
          {
            name: 'validation_rules',
            type: 'json',
            isNullable: true,
            comment: 'Reglas de validación adicionales',
          },
          {
            name: 'required_fields',
            type: 'json',
            isNullable: true,
            comment: 'Lista de campos requeridos',
          },
          {
            name: 'default_values',
            type: 'json',
            isNullable: true,
            comment: 'Valores por defecto para campos',
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'version',
            type: 'int',
            default: 1,
            comment: 'Versión de la plantilla',
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

    // Crear tabla de versiones de templates
    await queryRunner.createTable(
      new Table({
        name: 'template_versions',
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
            name: 'template_id',
            type: 'varchar',
            length: '36',
          },
          {
            name: 'version',
            type: 'int',
          },
          {
            name: 'metadata_schema',
            type: 'json',
          },
          {
            name: 'fields_schema',
            type: 'json',
          },
          {
            name: 'validation_rules',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'required_fields',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'default_values',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'change_notes',
            type: 'text',
            isNullable: true,
            comment: 'Notas sobre los cambios en esta versión',
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
      'templates',
      new TableForeignKey({
        name: 'FK_templates_category',
        columnNames: ['category_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'categories',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'templates',
      new TableForeignKey({
        name: 'FK_templates_initial_status',
        columnNames: ['initial_status_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'status',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'templates',
      new TableForeignKey({
        name: 'FK_templates_created_by',
        columnNames: ['created_by'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'templates',
      new TableForeignKey({
        name: 'FK_templates_updated_by',
        columnNames: ['updated_by'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );

    // Foreign keys para template_versions
    await queryRunner.createForeignKey(
      'template_versions',
      new TableForeignKey({
        name: 'FK_template_versions_template',
        columnNames: ['template_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'templates',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'template_versions',
      new TableForeignKey({
        name: 'FK_template_versions_created_by',
        columnNames: ['created_by'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('template_versions');
    await queryRunner.dropTable('templates');
  }
}
