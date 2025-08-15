import { NextResponse } from 'next/server';
import { getOrchestratorMetrics } from '@/services/moduleOrchestrator';

export async function GET() {
  const metrics = getOrchestratorMetrics();
  if (!metrics) {
    return NextResponse.json(
      { status: 'stale', message: 'No hay ciclos registrados aún' },
      { status: 200 }
    );
  }
  return NextResponse.json({ status: 'ok', metrics }, { status: 200 });
}
