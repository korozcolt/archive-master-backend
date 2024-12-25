/* eslint-disable @typescript-eslint/no-unused-vars */
import * as bcrypt from 'bcrypt';

// src/database/migrations/1734929185126-CreateAdminUser.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAdminUser1734929185126 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Insertar rol admin
    const roleResult = await queryRunner.query(
      `INSERT INTO roles (id, name, description, is_active) 
       VALUES (UUID(), 'admin', 'Administrator role', true)`,
    );

    // Obtener el ID del rol admin
    const [{ id: roleId }] = await queryRunner.query(
      `SELECT id FROM roles WHERE name = 'admin' LIMIT 1`,
    );

    // Crear hash del password
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash('admin123', salt);

    // Insertar usuario admin
    await queryRunner.query(
      `INSERT INTO users (id, email, password, first_name, last_name, is_active, role_id) 
       VALUES (UUID(), 'admin@example.com', ?, 'Admin', 'User', true, ?)`,
      [hashedPassword, roleId],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM users WHERE email = 'admin@example.com'`);
    await queryRunner.query(`DELETE FROM roles WHERE name = 'admin'`);
  }
}
