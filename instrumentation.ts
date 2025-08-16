import logger from './src/lib/logger';

export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  if (process.env.MODULE_ORCHESTRATOR_DISABLED === 'true') {
    logger.info('Module orchestrator disabled via MODULE_ORCHESTRATOR_DISABLED');
    return;
  }
  if (!process.env.MONGODB_URI) {
    logger.warn('MONGODB_URI is not set; module orchestrator will not start');
    return;
  }
  const orchestrator = await import('./src/services/moduleOrchestrator');
  const interval = process.env.MODULE_ORCHESTRATOR_INTERVAL_MS
    ? Number(process.env.MODULE_ORCHESTRATOR_INTERVAL_MS)
    : undefined;
  orchestrator.startModuleOrchestrator(interval ? { intervalMs: interval } : undefined);
  const handleSignal = () => {
    orchestrator.stopModuleOrchestrator();
    process.off('SIGINT', handleSignal);
    process.off('SIGTERM', handleSignal);
  };
  process.on('SIGINT', handleSignal);
  process.on('SIGTERM', handleSignal);
}
