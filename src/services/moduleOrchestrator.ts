import Module from '../models/Module';
import * as eventBus from '../messaging/eventBus';
import logger from '../lib/logger';

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
  const modules = await Module.find({ deletedAt: { $exists: false } });
  const now = Date.now();

  const results = await Promise.all(
    modules.map(async (mod) => {
      let pingUrl: string;
      try {
        pingUrl = new URL('/ping', mod.endpoints.rest).toString();
      } catch (err) {
        logger.error('Invalid ping URL for module', mod._id, err);
        await Module.findByIdAndUpdate(mod._id, { status: 'offline' });
        try {
          await eventBus.publish('module.offline', { moduleId: String(mod._id) });
        } catch (err) {
          logger.error('Failed to publish module.offline event', err);
        }
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
      try {
        await Module.findByIdAndUpdate(mod._id, {
          status: 'online',
          lastHandshake: new Date(),
        });
      } catch (err) {
        logger.error('Failed to update module to online', mod._id, err);
        continue;
      }
      logger.info(`Module ${mod._id} is online`);
      try {
        await eventBus.publish('module.online', { moduleId: String(mod._id) });
      } catch (err) {
        logger.error('Failed to publish module.online event', err);
      }
    } else {
      if (
        pruneOfflineMs &&
        mod.lastHandshake &&
        now - new Date(mod.lastHandshake).getTime() > pruneOfflineMs
      ) {
        try {
          await Module.deleteOne({ _id: mod._id });
        } catch (err) {
          logger.error('Failed to delete module', mod._id, err);
          continue;
        }
        logger.info(`Module ${mod._id} removed after exceeding offline threshold`);
        try {
          await eventBus.publish('module.removed', { moduleId: String(mod._id) });
        } catch (err) {
          logger.error('Failed to publish module.removed event', err);
        }
        continue;
      }
      try {
        await Module.findByIdAndUpdate(mod._id, { status: 'offline' });
      } catch (err) {
        logger.error('Failed to update module to offline', mod._id, err);
        continue;
      }
      logger.info(`Module ${mod._id} is offline`);
      try {
        await eventBus.publish('module.offline', { moduleId: String(mod._id) });
      } catch (err) {
        logger.error('Failed to publish module.offline event', err);
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
      logger.error('Module orchestration error', err);
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
