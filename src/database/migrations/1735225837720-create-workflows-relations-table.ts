import { MigrationInterface, QueryRunner, TableForeignKey } from 'typeorm';

export class CreateWorkflowsRelationsTable1735225837720 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createForeignKey(
      'workflow_transitions',
      new TableForeignKey({
        name: 'FK_workflow_transitions_workflow_definition',
        columnNames: ['workflow_definition_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'workflow_definitions',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'workflow_transitions',
      new TableForeignKey({
        name: 'FK_workflow_transitions_from_step',
        columnNames: ['from_step_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'workflow_steps',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'workflow_transitions',
      new TableForeignKey({
        name: 'FK_workflow_transitions_to_step',
        columnNames: ['to_step_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'workflow_steps',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'workflow_transitions',
      new TableForeignKey({
        name: 'FK_workflow_transitions_required_role',
        columnNames: ['required_role_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'roles',
        onDelete: 'SET NULL',
      }),
    );

    // workflow_instances
    await queryRunner.createForeignKey(
      'workflow_instances',
      new TableForeignKey({
        name: 'FK_workflow_instances_workflow_definition',
        columnNames: ['workflow_definition_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'workflow_definitions',
        onDelete: 'RESTRICT',
      }),
    );

    await queryRunner.createForeignKey(
      'workflow_instances',
      new TableForeignKey({
        name: 'FK_workflow_instances_document',
        columnNames: ['document_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'documents',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'workflow_instances',
      new TableForeignKey({
        name: 'FK_workflow_instances_current_step',
        columnNames: ['current_step_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'workflow_steps',
        onDelete: 'RESTRICT',
      }),
    );

    // workflow_tasks
    await queryRunner.createForeignKey(
      'workflow_tasks',
      new TableForeignKey({
        name: 'FK_workflow_tasks_workflow_instance',
        columnNames: ['workflow_instance_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'workflow_instances',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'workflow_tasks',
      new TableForeignKey({
        name: 'FK_workflow_tasks_step',
        columnNames: ['step_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'workflow_steps',
        onDelete: 'RESTRICT',
      }),
    );

    await queryRunner.createForeignKey(
      'workflow_tasks',
      new TableForeignKey({
        name: 'FK_workflow_tasks_assignee_role',
        columnNames: ['assignee_role_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'roles',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'workflow_tasks',
      new TableForeignKey({
        name: 'FK_workflow_tasks_assignee',
        columnNames: ['assignee_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
