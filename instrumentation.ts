import * as orchestrator from './src/services/moduleOrchestrator';

export function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const interval = process.env.MODULE_ORCHESTRATOR_INTERVAL_MS
    ? Number(process.env.MODULE_ORCHESTRATOR_INTERVAL_MS)
    : undefined;
  orchestrator.startModuleOrchestrator(interval ? { intervalMs: interval } : undefined);
  const shutdown = () => {
    orchestrator.stopModuleOrchestrator();
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
  process.once('exit', shutdown);
}

