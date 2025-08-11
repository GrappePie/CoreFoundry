// filepath: src/app/dashboard/page.tsx
import OwnerDashboard from './OwnerDashboard';
import AdminDashboard from './AdminDashboard';
import EmployeeDashboard from './EmployeeDashboard';
import { Role } from '@/auth/roles';
import { cookies } from 'next/headers';

export default async function DashboardEntry() {
  // Read user role from secure cookie
  const cookieStore = await cookies();
  const role = (cookieStore.get('user-role')?.value as Role) || 'employee';

  switch (role) {
    case 'owner':
      return <OwnerDashboard />;
    case 'admin':
      return <AdminDashboard />;
    default:
      return <EmployeeDashboard />;
  }
}
