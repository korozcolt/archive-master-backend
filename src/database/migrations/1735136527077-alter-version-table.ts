import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AlterVersionTable1735136527077 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Modificar columna de content
    await queryRunner.changeColumn(
      'versions',
      'content',
      new TableColumn({
        name: 'content',
        type: 'text',
        isNullable: false,
      }),
    );

    // Modificar columna de changes
    await queryRunner.changeColumn(
      'versions',
      'changes',
      new TableColumn({
        name: 'changes',
        type: 'text',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback: volver a cambiar las columnas (si es posible)
    await queryRunner.changeColumn(
      'versions',
      'content',
      new TableColumn({
        name: 'content',
        type: 'text',
        isNullable: false,
      }),
    );

    await queryRunner.changeColumn(
      'versions',
      'changes',
      new TableColumn({
        name: 'changes',
        type: 'text',
        isNullable: true,
      }),
    );
  }
}
