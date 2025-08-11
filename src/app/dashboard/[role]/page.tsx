import OwnerDashboard from '../OwnerDashboard';
import AdminDashboard from '../AdminDashboard';
import EmployeeDashboard from '../EmployeeDashboard';
import { Role } from '@/auth/roles';

export default function DashboardPage({ params }: { params: { role: Role } }) {
  switch (params.role) {
    case 'owner':
      return <OwnerDashboard />;
    case 'admin':
      return <AdminDashboard />;
    default:
      return <EmployeeDashboard />;
  }
}
