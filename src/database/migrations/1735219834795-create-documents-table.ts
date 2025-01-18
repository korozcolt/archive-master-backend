import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateDocumentsTables1735140000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Crear tabla documents
    await queryRunner.createTable(
      new Table({
        name: 'documents',
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
            name: 'title',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['contract', 'invoice', 'report', 'internal_memo', 'other'],
            default: "'other'",
          },
          {
            name: 'metadata',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'current_version_number',
            type: 'int',
            default: 1,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['draft', 'pending_review', 'under_revision', 'approved', 'rejected', 'archived'],
            default: "'draft'",
          },
          {
            name: 'category_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'created_by_id',
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
    );

    // Crear tabla document_versions
    await queryRunner.createTable(
      new Table({
        name: 'document_versions',
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
            name: 'document_id',
            type: 'varchar',
            length: '36',
          },
          {
            name: 'version_number',
            type: 'int',
          },
          {
            name: 'content',
            type: 'text',
          },
          {
            name: 'changes',
            type: 'json',
            isNullable: true,
          },
          {
            name: 'created_by_id',
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
    );

    // Agregar foreign keys
    await queryRunner.createForeignKey(
      'documents',
      new TableForeignKey({
        name: 'FK_documents_category',
        columnNames: ['category_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'categories',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'documents',
      new TableForeignKey({
        name: 'FK_documents_user',
        columnNames: ['created_by_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'document_versions',
      new TableForeignKey({
        name: 'FK_document_versions_document',
        columnNames: ['document_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'documents',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'document_versions',
      new TableForeignKey({
        name: 'FK_document_versions_user',
        columnNames: ['created_by_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar foreign keys de document_versions
    await queryRunner.dropForeignKey('document_versions', 'FK_document_versions_document');
    await queryRunner.dropForeignKey('document_versions', 'FK_document_versions_user');

    // Eliminar foreign keys de documents
    await queryRunner.dropForeignKey('documents', 'FK_documents_category');
    await queryRunner.dropForeignKey('documents', 'FK_documents_user');

    // Eliminar tablas
    await queryRunner.dropTable('document_versions');
    await queryRunner.dropTable('documents');
  }
}
