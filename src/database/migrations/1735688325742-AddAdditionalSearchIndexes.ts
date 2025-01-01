// src/database/migrations/[timestamp]-EnhanceDocumentSearchIndexes.ts

import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnhanceDocumentSearchIndexes1735667104214 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Agregar índice FULLTEXT
    await queryRunner.query(`
      ALTER TABLE documents 
      ADD FULLTEXT INDEX document_search_idx (title, description)
    `);

    // Índice compuesto para búsquedas frecuentes
    await queryRunner.query(`
      ALTER TABLE documents
      ADD INDEX document_search_combined_idx (status, type, category_id, created_at)
    `);

    // Índice para versionamiento
    await queryRunner.query(`
      ALTER TABLE documents
      ADD INDEX document_version_idx (current_version_number)
    `);

    // Optimizar la tabla
    await queryRunner.query('OPTIMIZE TABLE documents');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover índices en orden inverso
    await queryRunner.query('DROP INDEX document_version_idx ON documents');
    await queryRunner.query('DROP INDEX document_search_combined_idx ON documents');
    await queryRunner.query('DROP INDEX document_search_idx ON documents');
  }
}
