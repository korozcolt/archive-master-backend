// src/database/migrations/[timestamp]-seed-status.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedStatus1735011364002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Insertar estados básicos
    const states = [
      {
        name: 'Draft',
        code: 'DRAFT',
        description: 'Document is in draft state',
        color: '#9CA3AF',
        icon: 'edit',
      },
      {
        name: 'Pending Review',
        code: 'PENDING_REVIEW',
        description: 'Document is waiting for review',
        color: '#F59E0B',
        icon: 'clock',
      },
      {
        name: 'Approved',
        code: 'APPROVED',
        description: 'Document has been approved',
        color: '#10B981',
        icon: 'check',
      },
      {
        name: 'Rejected',
        code: 'REJECTED',
        description: 'Document has been rejected',
        color: '#EF4444',
        icon: 'x',
      },
      {
        name: 'Published',
        code: 'PUBLISHED',
        description: 'Document is published and active',
        color: '#3B82F6',
        icon: 'globe',
      },
      {
        name: 'Archived',
        code: 'ARCHIVED',
        description: 'Document has been archived',
        color: '#6B7280',
        icon: 'archive',
      },
    ];

    // Insertar estados
    for (const state of states) {
      await queryRunner.query(
        `INSERT INTO status (id, name, code, description, color, icon, is_active) 
         VALUES (UUID(), ?, ?, ?, ?, ?, true)`,
        [state.name, state.code, state.description, state.color, state.icon],
      );
    }

    // Obtener IDs de estados
    const statusMap = {};
    for (const state of states) {
      const [result] = await queryRunner.query('SELECT id FROM status WHERE code = ?', [
        state.code,
      ]);
      statusMap[state.code] = result.id;
    }

    // Obtener rol admin
    const [adminRole] = await queryRunner.query(
      `SELECT id FROM roles WHERE name = 'admin' LIMIT 1`,
    );

    // Definir transiciones básicas
    const transitions = [
      {
        from: 'DRAFT',
        to: 'PENDING_REVIEW',
        name: 'Submit for Review',
        description: 'Submit document for review',
        requires_comment: false,
      },
      {
        from: 'PENDING_REVIEW',
        to: 'APPROVED',
        name: 'Approve',
        description: 'Approve the document',
        requires_comment: false,
        required_role_id: adminRole.id,
      },
      {
        from: 'PENDING_REVIEW',
        to: 'REJECTED',
        name: 'Reject',
        description: 'Reject the document',
        requires_comment: true,
        required_role_id: adminRole.id,
      },
      {
        from: 'REJECTED',
        to: 'DRAFT',
        name: 'Return to Draft',
        description: 'Return document to draft state',
        requires_comment: false,
      },
      {
        from: 'APPROVED',
        to: 'PUBLISHED',
        name: 'Publish',
        description: 'Publish the document',
        requires_comment: false,
        required_role_id: adminRole.id,
      },
      {
        from: 'PUBLISHED',
        to: 'ARCHIVED',
        name: 'Archive',
        description: 'Archive the document',
        requires_comment: true,
        required_role_id: adminRole.id,
      },
    ];

    // Insertar transiciones
    for (const transition of transitions) {
      await queryRunner.query(
        `INSERT INTO status_transitions 
         (id, from_status_id, to_status_id, name, description, requires_comment, required_role_id, is_active) 
         VALUES (UUID(), ?, ?, ?, ?, ?, ?, true)`,
        [
          statusMap[transition.from],
          statusMap[transition.to],
          transition.name,
          transition.description,
          transition.requires_comment,
          transition.required_role_id,
        ],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DELETE FROM status_transitions');
    await queryRunner.query('DELETE FROM status');
  }
}
