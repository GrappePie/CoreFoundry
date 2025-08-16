export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const orchestrator = await import('./src/services/moduleOrchestrator');
  const interval = process.env.MODULE_ORCHESTRATOR_INTERVAL_MS
    ? Number(process.env.MODULE_ORCHESTRATOR_INTERVAL_MS)
    : undefined;
  orchestrator.startModuleOrchestrator(interval ? { intervalMs: interval } : undefined);
  // Nota: no se registran señales de proceso para compatibilidad edge/serverless
}
