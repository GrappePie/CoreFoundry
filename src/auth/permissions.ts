import { Role } from './roles';

export type Permission = string;

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  owner: ['*'],
  admin: ['manage:users', 'manage:modules'],
  employee: ['read:basic'],
};
