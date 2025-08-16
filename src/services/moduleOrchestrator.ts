import Module, { IModule } from '../models/Module';
import * as eventBus from '../messaging/eventBus';
import logger from '../lib/logger';
import type { FilterQuery } from 'mongoose';
import { Types } from 'mongoose';
import dbConnect from '../lib/mongodb';

let timer: NodeJS.Timeout | null = null;
let isRunning = false;
let isActive = false;

// Métricas del último ciclo del orquestador
export interface OrchestratorMetrics {
  online: number;
  offline: number;
  durationMs: number;
  timestamp: string; // ISO
  isActive: boolean;
  isRunning: boolean;
}
let lastMetrics: OrchestratorMetrics | null = null;
export function getOrchestratorMetrics(): OrchestratorMetrics | null {
  return lastMetrics;
}

export interface OrchestratorOptions {
  intervalMs?: number;
  pruneOfflineMs?: number;
  maxConcurrentPings?: number;
  pingTimeoutMs?: number;
  batchSize?: number;
  pingPath?: string;
}

/**
 * Pings registered modules and updates their status.
 * Optionally removes modules that have been offline for longer than `pruneOfflineMs`.
 */
export async function checkModules(
  pruneOfflineMs?: number,
  pingTimeoutMs = 5_000,
  maxConcurrentPings = 10,
  batchSize = 100,
  pingPath = 'ping'
) {
  if (pruneOfflineMs !== undefined && pruneOfflineMs <= 0) {
    throw new Error('pruneOfflineMs must be a positive number');
  }
  if (pingTimeoutMs <= 0) {
    throw new Error('pingTimeoutMs must be a positive number');
  }
  if (maxConcurrentPings <= 0) {
    throw new Error('maxConcurrentPings must be a positive number');
  }
  if (batchSize <= 0) {
    throw new Error('batchSize must be a positive number');
  }
  if (!pingPath || pingPath.length === 0) {
    throw new Error('pingPath must be a non-empty string');
  }

  // Asegurar conexión a la base de datos si está configurada; en test, no forzar
  const argv = process.argv.join(' ');
  const isNodeTest = argv.includes('--test');
  const isTest = String(process.env.NODE_ENV).toLowerCase() === 'test' || isNodeTest;
  if (!process.env.MONGODB_URI && !isTest) {
    logger.warn('MONGODB_URI is not set; skipping module check');
    return;
  }
  if (process.env.MONGODB_URI) {
    try {
      await dbConnect();
    } catch (err) {
      logger.error('Failed to connect to MongoDB for module orchestration', err);
      if (!isTest) return; // En producción, no ejecutar sin DB cuando estaba configurada
    }
  } else {
    // Sin URI de Mongo, continuar: en tests se mockean operaciones de Mongoose
    logger.warn('MONGODB_URI is not set; proceeding without DB connection');
  }

  const startTime = Date.now();
  const now = startTime;
  let onlineCount = 0;
  let offlineCount = 0;

  async function pingModule(mod: IModule): Promise<{ mod: IModule; online: boolean } | null> {
    let pingUrl: string;
    try {
      const baseUrl = mod.endpoints.rest.endsWith('/')
        ? mod.endpoints.rest
        : `${mod.endpoints.rest}/`;
      pingUrl = new URL(pingPath, baseUrl).toString();
    } catch (err) {
      logger.error('Invalid ping URL for module', mod._id, err);
      const wasOffline = mod.status === 'offline';
      const update: Partial<IModule> = { status: 'offline' };
      if (!mod.lastHandshake) {
        update.lastHandshake = new Date();
      }
      try {
        await Module.findByIdAndUpdate(mod._id, update);
      } catch (err) {
        logger.error('Failed to update module status after invalid ping URL', err);
      }
      if (!wasOffline) {
        try {
          await eventBus.publish('module.offline', { moduleId: String(mod._id) });
        } catch (err) {
          logger.error('Failed to publish module.offline event', err);
        }
      }
      offlineCount++;
      return null;
    }
    let online = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), pingTimeoutMs);
    try {
      const res = await fetch(pingUrl, {
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${mod.integrationToken}`,
        },
      });
      online = res.ok;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        online = false;
      } else {
        online = false;
        logger.error('Ping failed', mod._id, err);
      }
    } finally {
      clearTimeout(timeout);
    }
    return { mod, online };
  }

  async function processBatch(modules: IModule[]) {
    const results: Array<{ mod: IModule; online: boolean } | null> = [];
    let index = 0;
    async function worker() {
      while (true) {
        const mod = modules[index++];
        if (!mod) break;
        results.push(await pingModule(mod));
      }
    }
    const workers = Array.from(
      { length: Math.min(maxConcurrentPings, modules.length) },
      () => worker()
    );
    await Promise.all(workers);

      for (const result of results) {
        if (!result) continue;
        const { mod, online } = result;
        if (online) {
          onlineCount++;
          const wasOnline = mod.status === 'online';
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
          if (!wasOnline) {
            try {
              await eventBus.publish('module.online', { moduleId: String(mod._id) });
            } catch (err) {
              logger.error('Failed to publish module.online event', err);
            }
          }
        } else {
          offlineCount++;
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
          logger.info(
            `Module ${mod._id} removed after exceeding offline threshold`
          );
          try {
            await eventBus.publish('module.removed', {
              moduleId: String(mod._id),
            });
          } catch (err) {
            logger.error('Failed to publish module.removed event', err);
          }
          continue;
        }
        const wasOffline = mod.status === 'offline';
        const update: Partial<IModule> = { status: 'offline' };
        if (!mod.lastHandshake) {
          update.lastHandshake = new Date();
        }
        try {
          await Module.findByIdAndUpdate(mod._id, update);
        } catch (err) {
          logger.error('Failed to update module to offline', mod._id, err);
          continue;
        }
        logger.info(`Module ${mod._id} is offline`);
        if (!wasOffline) {
          try {
            await eventBus.publish('module.offline', {
              moduleId: String(mod._id),
            });
          } catch (err) {
            logger.error('Failed to publish module.offline event', err);
          }
        }
      }
    }
  }

  let lastId: Types.ObjectId | null = null;
  while (true) {
    const query: FilterQuery<IModule> = { deletedAt: { $exists: false } };
    if (lastId) {
      query._id = { $gt: lastId } as any;
    }
    const modules: IModule[] = await Module.find(query)
      .sort({ _id: 1 })
      .limit(batchSize);
    if (modules.length === 0) break;
    await processBatch(modules);
    // Avanzar el cursor usando el último _id del lote (ordenado ascendente)
    lastId = (modules[modules.length - 1] as any)._id as any;
  }

  const durationMs = Date.now() - startTime;
  try {
    await eventBus.publish('orchestrator.cycle', {
      online: onlineCount,
      offline: offlineCount,
      durationMs,
    });
  } catch (err) {
    logger.error('Failed to publish orchestrator.cycle event', err);
  }
  // Guardar métricas del último ciclo
  lastMetrics = {
    online: onlineCount,
    offline: offlineCount,
    durationMs,
    timestamp: new Date().toISOString(),
    isActive,
    isRunning,
  };
}

/**
 * Starts periodic module orchestration.
 */
export function startModuleOrchestrator(options: OrchestratorOptions = {}) {
  const {
    intervalMs = 60_000,
    pruneOfflineMs,
    maxConcurrentPings,
    pingTimeoutMs,
    batchSize = 100,
    pingPath,
  } = options;
  if (intervalMs <= 0) {
    throw new Error('intervalMs must be a positive number');
  }
  if (pruneOfflineMs !== undefined && pruneOfflineMs <= 0) {
    throw new Error('pruneOfflineMs must be a positive number');
  }
  if (pingTimeoutMs !== undefined && pingTimeoutMs <= 0) {
    throw new Error('pingTimeoutMs must be a positive number');
  }
  if (maxConcurrentPings !== undefined && maxConcurrentPings <= 0) {
    throw new Error('maxConcurrentPings must be a positive number');
  }
  if (batchSize <= 0) {
    throw new Error('batchSize must be a positive number');
  }
  if (pingPath !== undefined && pingPath.length === 0) {
    throw new Error('pingPath must be a non-empty string');
  }
  if (isActive) return;
  isActive = true;

  const run = async () => {
    if (!isActive || isRunning) return;
    isRunning = true;
    try {
      await checkModules(
        pruneOfflineMs,
        pingTimeoutMs,
        maxConcurrentPings,
        batchSize,
        pingPath
      );
    } catch (err) {
      logger.error('Module orchestration error', err);
    } finally {
      isRunning = false;
      if (lastMetrics) {
        lastMetrics.isRunning = isRunning;
        lastMetrics.isActive = isActive;
      }
      if (isActive) {
        if (timer) clearTimeout(timer);
        timer = setTimeout(run, intervalMs);
      }
    }
  };

  run();
}

/**
 * Stops the running module orchestrator.
 */
export function stopModuleOrchestrator() {
  isActive = false;
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}
