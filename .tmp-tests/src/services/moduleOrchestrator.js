"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrchestratorMetrics = getOrchestratorMetrics;
exports.checkModules = checkModules;
exports.startModuleOrchestrator = startModuleOrchestrator;
exports.stopModuleOrchestrator = stopModuleOrchestrator;
const Module_1 = __importDefault(require("../models/Module"));
const eventBus = __importStar(require("../messaging/eventBus"));
const logger_1 = __importDefault(require("../lib/logger"));
const mongodb_1 = __importDefault(require("../lib/mongodb"));
let timer = null;
let isRunning = false;
let isActive = false;
let lastMetrics = null;
function getOrchestratorMetrics() {
    return lastMetrics;
}
/**
 * Pings registered modules and updates their status.
 * Optionally removes modules that have been offline for longer than `pruneOfflineMs`.
 */
async function checkModules(pruneOfflineMs, pingTimeoutMs = 5000, maxConcurrentPings = 10, batchSize = 100, pingPath = 'ping') {
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
    if (process.env.MONGODB_URI) {
        try {
            await (0, mongodb_1.default)();
        }
        catch (err) {
            logger_1.default.error('Failed to connect to MongoDB for module orchestration', err);
            if (!isTest)
                return; // En producción, no ejecutar sin DB
        }
    }
    else if (!isTest) {
        logger_1.default.error('MONGODB_URI is not set; skipping module orchestration cycle');
        return;
    }
    const startTime = Date.now();
    const now = startTime;
    let onlineCount = 0;
    let offlineCount = 0;
    async function pingModule(mod) {
        let pingUrl;
        try {
            const baseUrl = mod.endpoints.rest.endsWith('/')
                ? mod.endpoints.rest
                : `${mod.endpoints.rest}/`;
            pingUrl = new URL(pingPath, baseUrl).toString();
        }
        catch (err) {
            logger_1.default.error('Invalid ping URL for module', mod._id, err);
            const wasOffline = mod.status === 'offline';
            const update = { status: 'offline' };
            if (!mod.lastHandshake) {
                update.lastHandshake = new Date();
            }
            await Module_1.default.findByIdAndUpdate(mod._id, update);
            if (!wasOffline) {
                try {
                    await eventBus.publish('module.offline', { moduleId: String(mod._id) });
                }
                catch (err) {
                    logger_1.default.error('Failed to publish module.offline event', err);
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
        }
        catch (err) {
            if (err instanceof Error && err.name === 'AbortError') {
                online = false;
            }
            else {
                online = false;
                logger_1.default.error('Ping failed', mod._id, err);
            }
        }
        finally {
            clearTimeout(timeout);
        }
        return { mod, online };
    }
    async function processBatch(modules) {
        const results = [];
        let index = 0;
        async function worker() {
            while (true) {
                const mod = modules[index++];
                if (!mod)
                    break;
                results.push(await pingModule(mod));
            }
        }
        const workers = Array.from({ length: Math.min(maxConcurrentPings, modules.length) }, () => worker());
        await Promise.all(workers);
        for (const result of results) {
            if (!result)
                continue;
            const { mod, online } = result;
            if (online) {
                onlineCount++;
                const wasOnline = mod.status === 'online';
                try {
                    await Module_1.default.findByIdAndUpdate(mod._id, {
                        status: 'online',
                        lastHandshake: new Date(),
                    });
                }
                catch (err) {
                    logger_1.default.error('Failed to update module to online', mod._id, err);
                    continue;
                }
                logger_1.default.info(`Module ${mod._id} is online`);
                if (!wasOnline) {
                    try {
                        await eventBus.publish('module.online', { moduleId: String(mod._id) });
                    }
                    catch (err) {
                        logger_1.default.error('Failed to publish module.online event', err);
                    }
                }
            }
            else {
                offlineCount++;
                if (pruneOfflineMs &&
                    mod.lastHandshake &&
                    now - new Date(mod.lastHandshake).getTime() > pruneOfflineMs) {
                    try {
                        await Module_1.default.deleteOne({ _id: mod._id });
                    }
                    catch (err) {
                        logger_1.default.error('Failed to delete module', mod._id, err);
                        continue;
                    }
                    logger_1.default.info(`Module ${mod._id} removed after exceeding offline threshold`);
                    try {
                        await eventBus.publish('module.removed', {
                            moduleId: String(mod._id),
                        });
                    }
                    catch (err) {
                        logger_1.default.error('Failed to publish module.removed event', err);
                    }
                    continue;
                }
                const wasOffline = mod.status === 'offline';
                const update = { status: 'offline' };
                if (!mod.lastHandshake) {
                    update.lastHandshake = new Date();
                }
                try {
                    await Module_1.default.findByIdAndUpdate(mod._id, update);
                }
                catch (err) {
                    logger_1.default.error('Failed to update module to offline', mod._id, err);
                    continue;
                }
                logger_1.default.info(`Module ${mod._id} is offline`);
                if (!wasOffline) {
                    try {
                        await eventBus.publish('module.offline', {
                            moduleId: String(mod._id),
                        });
                    }
                    catch (err) {
                        logger_1.default.error('Failed to publish module.offline event', err);
                    }
                }
            }
        }
    }
    let lastId = null;
    while (true) {
        const query = { deletedAt: { $exists: false } };
        if (lastId) {
            query._id = { $gt: lastId };
        }
        const modules = await Module_1.default.find(query)
            .sort({ _id: 1 })
            .limit(batchSize);
        if (modules.length === 0)
            break;
        await processBatch(modules);
        lastId = modules[modules.length - 1]._id;
    }
    const durationMs = Date.now() - startTime;
    try {
        await eventBus.publish('orchestrator.cycle', {
            online: onlineCount,
            offline: offlineCount,
            durationMs,
        });
    }
    catch (err) {
        logger_1.default.error('Failed to publish orchestrator.cycle event', err);
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
function startModuleOrchestrator(options = {}) {
    const { intervalMs = 60000, pruneOfflineMs, maxConcurrentPings, pingTimeoutMs, batchSize = 100, pingPath, } = options;
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
    if (isActive)
        return;
    isActive = true;
    const run = async () => {
        if (!isActive || isRunning)
            return;
        isRunning = true;
        try {
            await checkModules(pruneOfflineMs, pingTimeoutMs, maxConcurrentPings, batchSize, pingPath);
        }
        catch (err) {
            logger_1.default.error('Module orchestration error', err);
        }
        finally {
            isRunning = false;
            if (isActive) {
                if (timer)
                    clearTimeout(timer);
                timer = setTimeout(run, intervalMs);
            }
        }
    };
    run();
}
/**
 * Stops the running module orchestrator.
 */
function stopModuleOrchestrator() {
    isActive = false;
    if (timer) {
        clearTimeout(timer);
        timer = null;
    }
}
