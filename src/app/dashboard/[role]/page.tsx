import OwnerDashboard from '../OwnerDashboard';
import AdminDashboard from '../AdminDashboard';
import EmployeeDashboard from '../EmployeeDashboard';
import { Role } from '@/auth/roles';

export default async function DashboardPage({ params }: { params: { role: Role } }) {
  const { role } = await params;
  switch (role) {
    case 'owner':
      return <OwnerDashboard />;
    case 'admin':
      return <AdminDashboard />;
    default:
      return <EmployeeDashboard />;
  }
}
