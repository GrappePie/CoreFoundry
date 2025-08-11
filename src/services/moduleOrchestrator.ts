import Module from '../models/Module';
import * as eventBus from '../messaging/eventBus';

let timer: NodeJS.Timeout | null = null;
let isRunning = false;

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
      console.info(`Module ${mod._id} is online`);
      try {
        await eventBus.publish('module.online', { moduleId: String(mod._id) });
      } catch (err) {
        console.error('Failed to publish module.online event', err);
      }
    } else {
      if (
        pruneOfflineMs &&
        mod.lastHandshake &&
        now - new Date(mod.lastHandshake).getTime() > pruneOfflineMs
      ) {
        await Module.deleteOne({ _id: mod._id });
        console.info(`Module ${mod._id} removed after exceeding offline threshold`);
        try {
          await eventBus.publish('module.removed', { moduleId: String(mod._id) });
        } catch (err) {
          console.error('Failed to publish module.removed event', err);
        }
        continue;
      }
      await Module.findByIdAndUpdate(mod._id, { status: 'offline' });
      console.info(`Module ${mod._id} is offline`);
      try {
        await eventBus.publish('module.offline', { moduleId: String(mod._id) });
      } catch (err) {
        console.error('Failed to publish module.offline event', err);
      }
    }
  }
}

/**
 * Starts periodic module orchestration.
 */
export function startModuleOrchestrator(options: OrchestratorOptions = {}) {
  const { intervalMs = 60_000, pruneOfflineMs } = options;
  if (timer) return;

  const run = async () => {
    if (isRunning) return;
    isRunning = true;
    try {
      await checkModules(pruneOfflineMs);
    } catch (err) {
      console.error('Module orchestration error', err);
    } finally {
      isRunning = false;
      if (timer) {
        timer = setTimeout(run, intervalMs);
      }
    }
  };
  run();
  timer = setTimeout(run, intervalMs);
}

/**
 * Stops the running module orchestrator.
 */
export function stopModuleOrchestrator() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}
