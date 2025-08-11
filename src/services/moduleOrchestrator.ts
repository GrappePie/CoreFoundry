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
export async function checkModules(
  pruneOfflineMs?: number,
  pingTimeoutMs = 5_000
) {
  const modules = await Module.find();
  const now = Date.now();

  const results = await Promise.all(
    modules.map(async (mod) => {
      let pingUrl: string;
      try {
        pingUrl = new URL('/ping', mod.endpoints.rest).toString();
      } catch (err) {
        console.error('Invalid ping URL for module', mod._id, err);
        await Module.findByIdAndUpdate(mod._id, { status: 'offline' });
        return null;
      }
      let online = false;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), pingTimeoutMs);
      try {
        const res = await fetch(pingUrl, { signal: controller.signal });
        online = res.ok;
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          online = false;
        } else {
          online = false;
        }
      } finally {
        clearTimeout(timeout);
      }
      return { mod, online };
    })
  );

  for (const result of results) {
    if (!result) continue;
    const { mod, online } = result;
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
