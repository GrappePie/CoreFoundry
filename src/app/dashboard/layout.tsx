import { ReactNode } from 'react';
import HealthStatus from '@/components/HealthStatus';
import OrchestratorMetrics from '@/components/OrchestratorMetrics';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <section className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <OrchestratorMetrics />
        <HealthStatus />
      </div>
      {children}
    </section>
  );
}
