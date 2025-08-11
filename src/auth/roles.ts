export type Role = 'owner' | 'admin' | 'employee';

export const DASHBOARD_PATHS: Record<Role, string> = {
  owner: '/dashboard/owner',
  admin: '/dashboard/admin',
  employee: '/dashboard/employee',
};

export function getDashboardPath(role: Role): string {
  return DASHBOARD_PATHS[role];
}
