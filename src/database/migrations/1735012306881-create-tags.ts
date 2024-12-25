// src/database/migrations/[timestamp]-create-tags.ts
import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateTags1703296000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear tabla de tags
    await queryRunner.createTable(
      new Table({
        name: 'tags',
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
            name: 'slug',
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
            name: 'color',
            type: 'varchar',
            length: '7',
            default: "'#6B7280'",
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'parent_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
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

    // Crear tabla de relaciones entre tags (para jerarquía y relaciones)
    await queryRunner.createTable(
      new Table({
        name: 'tag_relations',
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
            name: 'source_tag_id',
            type: 'varchar',
            length: '36',
          },
          {
            name: 'related_tag_id',
            type: 'varchar',
            length: '36',
          },
          {
            name: 'relation_type',
            type: 'enum',
            enum: ['parent', 'related', 'synonym'],
            comment: 'Tipo de relación entre tags',
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
      'tags',
      new TableForeignKey({
        name: 'FK_tags_parent',
        columnNames: ['parent_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tags',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'tags',
      new TableForeignKey({
        name: 'FK_tags_created_by',
        columnNames: ['created_by'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'tags',
      new TableForeignKey({
        name: 'FK_tags_updated_by',
        columnNames: ['updated_by'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );

    // Foreign keys para tag_relations
    await queryRunner.createForeignKey(
      'tag_relations',
      new TableForeignKey({
        name: 'FK_tag_relations_source',
        columnNames: ['source_tag_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tags',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'tag_relations',
      new TableForeignKey({
        name: 'FK_tag_relations_related',
        columnNames: ['related_tag_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tags',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'tag_relations',
      new TableForeignKey({
        name: 'FK_tag_relations_created_by',
        columnNames: ['created_by'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('tag_relations');
    await queryRunner.dropTable('tags');
  }
}
