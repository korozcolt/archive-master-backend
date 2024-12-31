import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDocumentSearchIndexes1928379817239 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Índice FULLTEXT para búsqueda en título y descripción
    await queryRunner.query(`
     ALTER TABLE documents 
     ADD FULLTEXT INDEX document_search_idx (title, description)
   `);

    // Índice para búsqueda por tipo
    await queryRunner.query(`
     CREATE INDEX document_type_idx ON documents (type)
   `);

    // Índice para búsqueda por categoría
    await queryRunner.query(`
     CREATE INDEX document_category_idx ON documents (category_id)
   `);

    // Índice para búsqueda por fechas
    await queryRunner.query(`
     CREATE INDEX document_dates_idx ON documents (created_at, updated_at)
   `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX document_search_idx ON documents`);
    await queryRunner.query(`DROP INDEX document_type_idx ON documents`);
    await queryRunner.query(`DROP INDEX document_category_idx ON documents`);
    await queryRunner.query(`DROP INDEX document_dates_idx ON documents`);
  }
}
