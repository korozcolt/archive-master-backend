// src/database/migrations/[timestamp]-create-categories.ts
import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateCategories1734960803079 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear tabla de categorías
    await queryRunner.createTable(
      new Table({
        name: 'categories',
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
            name: 'slug',
            type: 'varchar',
            length: '100',
            isUnique: true,
          },
          {
            name: 'description',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'parent_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'metadata_schema',
            type: 'json',
            isNullable: true,
            comment: 'JSON schema for category-specific metadata',
          },
          {
            name: 'order',
            type: 'int',
            default: 0,
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

    // Agregar foreign key para parent_id (auto-referencial)
    await queryRunner.createForeignKey(
      'categories',
      new TableForeignKey({
        name: 'FK_categories_parent',
        columnNames: ['parent_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'categories',
        onDelete: 'SET NULL',
      }),
    );

    // Foreign keys para created_by y updated_by
    await queryRunner.createForeignKey(
      'categories',
      new TableForeignKey({
        name: 'FK_categories_created_by',
        columnNames: ['created_by'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'categories',
      new TableForeignKey({
        name: 'FK_categories_updated_by',
        columnNames: ['updated_by'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('categories');
    if (table) {
      const foreignKeys = table.foreignKeys;
      await Promise.all(
        foreignKeys.map((foreignKey) => queryRunner.dropForeignKey('categories', foreignKey)),
      );
    }
    await queryRunner.dropTable('categories');
  }
}
