// src/database/migrations/[timestamp]-create-workflow-tables.ts

import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateWorkflowTables1735150000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Crear tabla workflow_definitions
    await queryRunner.createTable(
      new Table({
        name: 'workflow_definitions',
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
    );

    // 2. Crear tabla workflow_steps
    await queryRunner.createTable(
      new Table({
        name: 'workflow_steps',
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
            name: 'workflow_definition_id',
            type: 'varchar',
            length: '36',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'description',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'status_id',
            type: 'varchar',
            length: '36',
          },
          {
            name: 'assignee_role_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'config',
            type: 'json',
            isNullable: true,
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
    );

    // 3. Crear tabla workflow_transitions
    await queryRunner.createTable(
      new Table({
        name: 'workflow_transitions',
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
            name: 'workflow_definition_id',
            type: 'varchar',
            length: '36',
          },
          {
            name: 'from_step_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'to_step_id',
            type: 'varchar',
            length: '36',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'description',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'required_role_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'requires_comment',
            type: 'boolean',
            default: false,
          },
          {
            name: 'conditions',
            type: 'json',
            isNullable: true,
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
    );

    // 4. Crear tabla workflow_instances
    await queryRunner.createTable(
      new Table({
        name: 'workflow_instances',
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
            name: 'workflow_definition_id',
            type: 'varchar',
            length: '36',
          },
          {
            name: 'document_id',
            type: 'varchar',
            length: '36',
          },
          {
            name: 'current_step_id',
            type: 'varchar',
            length: '36',
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['active', 'completed', 'cancelled'],
            default: "'active'",
          },
          {
            name: 'metadata',
            type: 'json',
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
    );

    // 5. Crear tabla workflow_tasks
    await queryRunner.createTable(
      new Table({
        name: 'workflow_tasks',
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
            name: 'workflow_instance_id',
            type: 'varchar',
            length: '36',
          },
          {
            name: 'step_id',
            type: 'varchar',
            length: '36',
          },
          {
            name: 'assignee_role_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'assignee_id',
            type: 'varchar',
            length: '36',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'in_progress', 'completed', 'cancelled'],
            default: "'pending'",
          },
          {
            name: 'comments',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'due_date',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'json',
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
    );

    // Crear Foreign Keys
    // workflow_definitions
    await queryRunner.createForeignKey(
      'workflow_definitions',
      new TableForeignKey({
        name: 'FK_workflow_definitions_created_by',
        columnNames: ['created_by'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'workflow_definitions',
      new TableForeignKey({
        name: 'FK_workflow_definitions_updated_by',
        columnNames: ['updated_by'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );

    // workflow_steps
    await queryRunner.createForeignKey(
      'workflow_steps',
      new TableForeignKey({
        name: 'FK_workflow_steps_workflow_definition',
        columnNames: ['workflow_definition_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'workflow_definitions',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'workflow_steps',
      new TableForeignKey({
        name: 'FK_workflow_steps_status',
        columnNames: ['status_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'status',
        onDelete: 'RESTRICT',
      }),
    );

    await queryRunner.createForeignKey(
      'workflow_steps',
      new TableForeignKey({
        name: 'FK_workflow_steps_assignee_role',
        columnNames: ['assignee_role_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'roles',
        onDelete: 'SET NULL',
      }),
    );

    // ...más foreign keys para las otras tablas
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Eliminar foreign keys
    await queryRunner.dropTable('workflow_tasks');
    await queryRunner.dropTable('workflow_instances');
    await queryRunner.dropTable('workflow_transitions');
    await queryRunner.dropTable('workflow_steps');
    await queryRunner.dropTable('workflow_definitions');
  }
}
