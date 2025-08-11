import Module from '../models/Module';

let interval: NodeJS.Timeout | null = null;

export interface OrchestratorOptions {
  intervalMs?: number;
  pruneOfflineMs?: number;
}

/**
 * Pings registered modules and updates their status.
 * Optionally removes modules that have been offline for longer than `pruneOfflineMs`.
 */
export async function checkModules(pruneOfflineMs?: number) {
  const modules = await Module.find();
  const now = Date.now();

  for (const mod of modules) {
    const pingUrl = new URL('/ping', mod.endpoints.rest).toString();
    let online = false;
    try {
      const res = await fetch(pingUrl);
      online = res.ok;
    } catch {
      online = false;
    }

    if (online) {
      await Module.findByIdAndUpdate(mod._id, {
        status: 'online',
        lastHandshake: new Date(),
      });
    } else {
      if (
        pruneOfflineMs &&
        mod.lastHandshake &&
        now - new Date(mod.lastHandshake).getTime() > pruneOfflineMs
      ) {
        await Module.deleteOne({ _id: mod._id });
        continue;
      }
      await Module.findByIdAndUpdate(mod._id, { status: 'offline' });
    }
  }
}

/**
 * Starts periodic module orchestration.
 */
export function startModuleOrchestrator(options: OrchestratorOptions = {}) {
  const { intervalMs = 60_000, pruneOfflineMs } = options;
  if (interval) return;
  interval = setInterval(() => {
    checkModules(pruneOfflineMs).catch((err) =>
      console.error('Module orchestration error', err)
    );
  }, intervalMs);
}

/**
 * Stops the running module orchestrator.
 */
export function stopModuleOrchestrator() {
  if (interval) {
    clearInterval(interval);
    interval = null;
  }
}
