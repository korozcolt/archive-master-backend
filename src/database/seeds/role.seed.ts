// src/database/seeds/role.seed.ts

import { DataSource } from 'typeorm';
import { Permission } from '../../modules/roles/entities/permission.entity';
import { Role } from '../../modules/roles/entities/role.entity';

export const createInitialRoles = async (dataSource: DataSource) => {
  const roleRepository = dataSource.getRepository(Role);
  const permissionRepository = dataSource.getRepository(Permission);

  // Crear permisos básicos
  const permissions = await permissionRepository.save([
    {
      name: 'create_documents',
      description: 'Can create documents',
      module: 'documents',
    },
    {
      name: 'read_documents',
      description: 'Can read documents',
      module: 'documents',
    },
    {
      name: 'update_documents',
      description: 'Can update documents',
      module: 'documents',
    },
    {
      name: 'delete_documents',
      description: 'Can delete documents',
      module: 'documents',
    },
    {
      name: 'manage_users',
      description: 'Can manage users',
      module: 'users',
    },
    {
      name: 'manage_roles',
      description: 'Can manage roles',
      module: 'roles',
    },
  ]);

  // Crear roles básicos
  const adminRole = roleRepository.create({
    name: 'admin',
    description: 'Administrator role',
    permissions: permissions,
  });

  const userRole = roleRepository.create({
    name: 'user',
    description: 'Basic user role',
    permissions: permissions.filter((p) => ['read_documents', 'create_documents'].includes(p.name)),
  });

  await roleRepository.save([adminRole, userRole]);
};
