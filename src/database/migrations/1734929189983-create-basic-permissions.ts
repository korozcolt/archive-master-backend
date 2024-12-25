// src/database/migrations/1734929189983-CreateBasicPermissions.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBasicPermissions1734929189983 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const permissions = [
      // Documentos
      ['documents', 'create_document', 'Can create documents'],
      ['documents', 'read_document', 'Can read documents'],
      ['documents', 'update_document', 'Can update documents'],
      ['documents', 'delete_document', 'Can delete documents'],

      // Usuarios
      ['users', 'create_user', 'Can create users'],
      ['users', 'read_user', 'Can read users'],
      ['users', 'update_user', 'Can update users'],
      ['users', 'delete_user', 'Can delete users'],

      // Roles
      ['roles', 'manage_roles', 'Can manage roles and permissions'],

      // Categorías
      ['categories', 'manage_categories', 'Can manage document categories'],

      // Workflow
      ['workflow', 'manage_workflow', 'Can manage document workflows'],
      ['workflow', 'approve_document', 'Can approve documents'],
      ['workflow', 'reject_document', 'Can reject documents'],
    ];

    // Insertar permisos
    for (const [module, name, description] of permissions) {
      await queryRunner.query(
        `INSERT INTO permissions (id, module, name, description) 
         VALUES (UUID(), ?, ?, ?)`,
        [module, name, description],
      );
    }

    // Obtener el rol admin
    const [adminRole] = await queryRunner.query(
      `SELECT id FROM roles WHERE name = 'admin' LIMIT 1`,
    );

    if (adminRole) {
      // Obtener todos los permisos
      const allPermissions = await queryRunner.query(
        `SELECT id FROM permissions`,
      );

      // Asignar todos los permisos al rol admin
      for (const permission of allPermissions) {
        await queryRunner.query(
          `INSERT INTO role_permissions (id, role_id, permission_id) 
           VALUES (UUID(), ?, ?)`,
          [adminRole.id, permission.id],
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DELETE FROM role_permissions');
    await queryRunner.query('DELETE FROM permissions');
  }
}
