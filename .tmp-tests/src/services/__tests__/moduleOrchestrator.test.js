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
const node_test_1 = require("node:test");
const strict_1 = __importDefault(require("node:assert/strict"));
const moduleOrchestrator_1 = require("../moduleOrchestrator");
const Module_1 = __importDefault(require("../../models/Module"));
const eventBus = __importStar(require("../../messaging/eventBus"));
const logger_1 = __importDefault(require("../../lib/logger"));
let originalFetch;
function createFindStub(modules, opts = {}) {
    return (query = {}) => {
        var _a;
        (_a = opts.onCall) === null || _a === void 0 ? void 0 : _a.call(opts);
        return {
            sort: (s) => {
                var _a;
                (_a = opts.onSort) === null || _a === void 0 ? void 0 : _a.call(opts, s);
                return {
                    limit: (l) => {
                        const filtered = modules
                            .filter((m) => !query._id || Number(m._id) > Number(query._id.$gt))
                            .sort((a, b) => String(a._id).localeCompare(String(b._id)))
                            .slice(0, l);
                        return Promise.resolve(filtered);
                    },
                };
            },
        };
    };
}
(0, node_test_1.beforeEach)(() => {
    originalFetch = global.fetch;
    eventBus.publish = async () => { };
});
(0, node_test_1.afterEach)(() => {
    global.fetch = originalFetch;
    (0, moduleOrchestrator_1.stopModuleOrchestrator)();
});
(0, node_test_1.describe)('moduleOrchestrator service', () => {
    (0, node_test_1.it)('continues when findByIdAndUpdate fails', async () => {
        const modules = [
            { _id: '1', endpoints: { rest: 'http://m1' }, lastHandshake: new Date() },
            { _id: '2', endpoints: { rest: 'http://m2' }, lastHandshake: new Date() },
        ];
        Module_1.default.find = createFindStub(modules);
        const updated = [];
        Module_1.default.findByIdAndUpdate = async (id) => {
            updated.push(String(id));
            if (String(id) === '1')
                throw new Error('fail');
        };
        global.fetch = async () => ({ ok: true });
        await (0, moduleOrchestrator_1.checkModules)();
        strict_1.default.deepEqual(updated, ['1', '2']);
    });
    (0, node_test_1.it)('continues when deleteOne fails', async () => {
        const modules = [
            { _id: '1', endpoints: { rest: 'http://m1' }, lastHandshake: new Date(0) },
            { _id: '2', endpoints: { rest: 'http://m2' }, lastHandshake: new Date() },
        ];
        Module_1.default.find = createFindStub(modules);
        const updated = [];
        Module_1.default.findByIdAndUpdate = async (id) => {
            updated.push(String(id));
        };
        const deleted = [];
        Module_1.default.deleteOne = async (query) => {
            deleted.push(String(query._id));
            throw new Error('delete fail');
        };
        global.fetch = async (url) => ({ ok: !url.includes('m1') });
        await (0, moduleOrchestrator_1.checkModules)(1);
        strict_1.default.deepEqual(deleted, ['1']);
        strict_1.default.deepEqual(updated, ['2']);
    });
    (0, node_test_1.it)('logs module id when ping fails', async () => {
        const modules = [
            { _id: '1', endpoints: { rest: 'http://m1' }, lastHandshake: new Date() },
        ];
        Module_1.default.find = createFindStub(modules);
        Module_1.default.findByIdAndUpdate = async () => { };
        const error = new Error('fail');
        global.fetch = async () => {
            throw error;
        };
        const logs = [];
        const originalError = logger_1.default.error;
        logger_1.default.error = (...args) => {
            logs.push(args);
        };
        await (0, moduleOrchestrator_1.checkModules)();
        logger_1.default.error = originalError;
        strict_1.default.ok(logs.some((args) => args[0] === 'Ping failed' && args[1] === '1' && args[2] === error));
    });
    (0, node_test_1.it)('sends Authorization header with integrationToken when pinging', async () => {
        const token = 'tok123';
        const modules = [
            {
                _id: '1',
                endpoints: { rest: 'http://m1' },
                lastHandshake: new Date(),
                status: 'offline',
                integrationToken: token,
            },
        ];
        Module_1.default.find = createFindStub(modules);
        Module_1.default.findByIdAndUpdate = async () => { };
        let headers;
        global.fetch = async (_url, opts) => {
            headers = opts === null || opts === void 0 ? void 0 : opts.headers;
            return { ok: true };
        };
        await (0, moduleOrchestrator_1.checkModules)();
        strict_1.default.equal(headers === null || headers === void 0 ? void 0 : headers.Authorization, `Bearer ${token}`);
    });
    (0, node_test_1.it)('publishes module.online when an offline module responds', async () => {
        const modules = [
            {
                _id: '1',
                endpoints: { rest: 'http://m1' },
                lastHandshake: new Date(0),
                status: 'offline',
            },
        ];
        Module_1.default.find = createFindStub(modules);
        const updated = [];
        Module_1.default.findByIdAndUpdate = async (id, update) => {
            updated.push({ id: String(id), status: update.status });
        };
        global.fetch = async () => ({ ok: true });
        const events = [];
        eventBus.publish = async (event, payload) => {
            events.push({ event, payload });
        };
        await (0, moduleOrchestrator_1.checkModules)();
        strict_1.default.deepEqual(updated, [{ id: '1', status: 'online' }]);
        strict_1.default.deepEqual(events, [{ event: 'module.online', payload: { moduleId: '1' } }]);
    });
    (0, node_test_1.it)('removes modules exceeding pruneOfflineMs and emits module.removed', async () => {
        const modules = [
            {
                _id: '1',
                endpoints: { rest: 'http://m1' },
                lastHandshake: new Date(0),
            },
        ];
        Module_1.default.find = createFindStub(modules);
        Module_1.default.findByIdAndUpdate = async () => {
            throw new Error('should not update');
        };
        const deleted = [];
        Module_1.default.deleteOne = async (query) => {
            deleted.push(String(query._id));
        };
        global.fetch = async () => ({ ok: false });
        const events = [];
        eventBus.publish = async (event, payload) => {
            events.push({ event, payload });
        };
        await (0, moduleOrchestrator_1.checkModules)(1);
        strict_1.default.deepEqual(deleted, ['1']);
        strict_1.default.deepEqual(events, [{ event: 'module.removed', payload: { moduleId: '1' } }]);
    });
    (0, node_test_1.it)('emits orchestrator.cycle with metrics', async () => {
        const modules = [
            { _id: '1', endpoints: { rest: 'http://m1' }, lastHandshake: new Date() },
            { _id: '2', endpoints: { rest: 'http://m2' }, lastHandshake: new Date() },
        ];
        Module_1.default.find = createFindStub(modules);
        Module_1.default.findByIdAndUpdate = async () => { };
        global.fetch = async (url) => ({ ok: !url.includes('m2') });
        const events = [];
        eventBus.publish = async (event, payload) => {
            events.push({ event, payload });
        };
        await (0, moduleOrchestrator_1.checkModules)();
        const metric = events.find((e) => e.event === 'orchestrator.cycle');
        strict_1.default.ok(metric);
        strict_1.default.equal(metric === null || metric === void 0 ? void 0 : metric.payload.online, 1);
        strict_1.default.equal(metric === null || metric === void 0 ? void 0 : metric.payload.offline, 1);
        strict_1.default.ok(typeof (metric === null || metric === void 0 ? void 0 : metric.payload.durationMs) === 'number');
    });
    (0, node_test_1.it)('prunes modules without lastHandshake on the next cycle', async () => {
        const modules = [
            {
                _id: '1',
                endpoints: { rest: 'http://m1' },
                status: 'online',
                lastHandshake: undefined,
            },
        ];
        Module_1.default.find = createFindStub(modules);
        Module_1.default.findByIdAndUpdate = async (id, update) => {
            const mod = modules.find((m) => String(m._id) === String(id));
            if (mod)
                Object.assign(mod, update);
        };
        const deleted = [];
        Module_1.default.deleteOne = async (query) => {
            deleted.push(String(query._id));
        };
        global.fetch = async () => ({ ok: false });
        await (0, moduleOrchestrator_1.checkModules)(1);
        strict_1.default.ok(modules[0].lastHandshake instanceof Date);
        strict_1.default.deepEqual(deleted, []);
        await new Promise((r) => setTimeout(r, 2));
        await (0, moduleOrchestrator_1.checkModules)(1);
        strict_1.default.deepEqual(deleted, ['1']);
    });
    (0, node_test_1.it)('respects maxConcurrentPings limit', async () => {
        const modules = Array.from({ length: 20 }, (_, i) => ({
            _id: String(i),
            endpoints: { rest: `http://m${i}` },
            lastHandshake: new Date(),
        }));
        Module_1.default.find = createFindStub(modules);
        Module_1.default.findByIdAndUpdate = async () => { };
        let active = 0;
        let maxActive = 0;
        global.fetch = async () => {
            active++;
            maxActive = Math.max(maxActive, active);
            await new Promise((r) => setTimeout(r, 5));
            active--;
            return { ok: true };
        };
        await (0, moduleOrchestrator_1.checkModules)(undefined, undefined, 5);
        strict_1.default.ok(maxActive <= 5);
    });
    (0, node_test_1.it)('iterates over multiple batches', async () => {
        const modules = Array.from({ length: 120 }, (_, i) => ({
            _id: String(i),
            endpoints: { rest: `http://m${i}` },
            lastHandshake: new Date(),
        }));
        let findCalls = 0;
        Module_1.default.find = createFindStub(modules, {
            onCall: () => {
                findCalls++;
            },
        });
        const updated = [];
        Module_1.default.findByIdAndUpdate = async (id) => {
            updated.push(String(id));
        };
        global.fetch = async () => ({ ok: true });
        await (0, moduleOrchestrator_1.checkModules)();
        strict_1.default.equal(findCalls, 3);
        strict_1.default.equal(updated.length, modules.length);
    });
    (0, node_test_1.it)('sorts modules by _id for stable pagination', async () => {
        const modules = [
            { _id: 'b', endpoints: { rest: 'http://m2' }, lastHandshake: new Date() },
            { _id: 'a', endpoints: { rest: 'http://m1' }, lastHandshake: new Date() },
            { _id: 'c', endpoints: { rest: 'http://m3' }, lastHandshake: new Date() },
        ];
        let sortOptions = null;
        Module_1.default.find = createFindStub(modules, {
            onSort: (s) => {
                sortOptions = s;
            },
        });
        const processed = [];
        Module_1.default.findByIdAndUpdate = async (id) => {
            processed.push(String(id));
        };
        global.fetch = async () => ({ ok: true });
        await (0, moduleOrchestrator_1.checkModules)();
        strict_1.default.deepEqual(sortOptions, { _id: 1 });
        strict_1.default.deepEqual(processed, ['a', 'b', 'c']);
    });
    (0, node_test_1.it)('aborts ping after pingTimeoutMs', async () => {
        const modules = [
            { _id: '1', endpoints: { rest: 'http://m1' }, lastHandshake: new Date() },
        ];
        Module_1.default.find = createFindStub(modules);
        Module_1.default.findByIdAndUpdate = async () => { };
        const durations = [];
        global.fetch = async (_, init) => new Promise((resolve) => {
            const start = Date.now();
            init.signal.addEventListener('abort', () => {
                durations.push(Date.now() - start);
                resolve({ ok: false });
            });
        });
        await (0, moduleOrchestrator_1.checkModules)(undefined, 10);
        strict_1.default.ok(durations[0] >= 10);
        strict_1.default.ok(durations[0] < 50);
    });
    (0, node_test_1.it)('uses custom pingPath when provided', async () => {
        const modules = [
            { _id: '1', endpoints: { rest: 'http://m1' }, lastHandshake: new Date() },
        ];
        Module_1.default.find = createFindStub(modules);
        Module_1.default.findByIdAndUpdate = async () => { };
        let url;
        global.fetch = async (u) => {
            url = u;
            return { ok: true };
        };
        await (0, moduleOrchestrator_1.checkModules)(undefined, undefined, undefined, undefined, 'status');
        strict_1.default.equal(url, 'http://m1/status');
    });
    (0, node_test_1.it)('passes pingTimeoutMs from startModuleOrchestrator to checkModules', async () => {
        const modules = [
            { _id: '1', endpoints: { rest: 'http://m1' }, lastHandshake: new Date() },
        ];
        Module_1.default.find = createFindStub(modules);
        Module_1.default.findByIdAndUpdate = async () => { };
        const durations = [];
        global.fetch = async (_, init) => new Promise((resolve) => {
            const start = Date.now();
            init.signal.addEventListener('abort', () => {
                durations.push(Date.now() - start);
                resolve({ ok: false });
            });
        });
        (0, moduleOrchestrator_1.startModuleOrchestrator)({ intervalMs: 1000, pingTimeoutMs: 10 });
        await new Promise((r) => setTimeout(r, 50));
        (0, moduleOrchestrator_1.stopModuleOrchestrator)();
        strict_1.default.ok(durations[0] >= 10);
        strict_1.default.ok(durations[0] < 50);
    });
    (0, node_test_1.it)('passes pingPath from startModuleOrchestrator to checkModules', async () => {
        const modules = [
            { _id: '1', endpoints: { rest: 'http://m1' }, lastHandshake: new Date() },
        ];
        Module_1.default.find = createFindStub(modules);
        Module_1.default.findByIdAndUpdate = async () => { };
        let url;
        global.fetch = async (u) => {
            url = u;
            return { ok: true };
        };
        (0, moduleOrchestrator_1.startModuleOrchestrator)({ intervalMs: 1000, pingPath: 'health' });
        await new Promise((r) => setTimeout(r, 50));
        (0, moduleOrchestrator_1.stopModuleOrchestrator)();
        strict_1.default.equal(url, 'http://m1/health');
    });
    (0, node_test_1.it)('passes batchSize from startModuleOrchestrator to checkModules', async () => {
        const modules = Array.from({ length: 120 }, (_, i) => ({
            _id: String(i),
            endpoints: { rest: `http://m${i}` },
            lastHandshake: new Date(),
        }));
        let findCalls = 0;
        Module_1.default.find = createFindStub(modules, {
            onCall: () => {
                findCalls++;
            },
        });
        Module_1.default.findByIdAndUpdate = async () => { };
        global.fetch = async () => ({ ok: true });
        (0, moduleOrchestrator_1.startModuleOrchestrator)({ intervalMs: 1000, batchSize: 50 });
        await new Promise((r) => setTimeout(r, 50));
        (0, moduleOrchestrator_1.stopModuleOrchestrator)();
        strict_1.default.equal(findCalls, 4);
    });
    (0, node_test_1.it)('passes pruneOfflineMs from startModuleOrchestrator to checkModules', async () => {
        const modules = [
            {
                _id: '1',
                endpoints: { rest: 'http://m1' },
                lastHandshake: new Date(0),
            },
        ];
        Module_1.default.find = createFindStub(modules);
        Module_1.default.findByIdAndUpdate = async () => {
            throw new Error('should not update');
        };
        const deleted = [];
        Module_1.default.deleteOne = async (query) => {
            deleted.push(String(query._id));
        };
        global.fetch = async () => ({ ok: false });
        const events = [];
        eventBus.publish = async (event, payload) => {
            events.push({ event, payload });
        };
        (0, moduleOrchestrator_1.startModuleOrchestrator)({ intervalMs: 1000, pruneOfflineMs: 1 });
        await new Promise((r) => setTimeout(r, 50));
        (0, moduleOrchestrator_1.stopModuleOrchestrator)();
        strict_1.default.deepEqual(deleted, ['1']);
        strict_1.default.deepEqual(events, [{ event: 'module.removed', payload: { moduleId: '1' } }]);
    });
    (0, node_test_1.it)('passes maxConcurrentPings from startModuleOrchestrator to checkModules', async () => {
        const modules = Array.from({ length: 20 }, (_, i) => ({
            _id: String(i),
            endpoints: { rest: `http://m${i}` },
            lastHandshake: new Date(),
        }));
        Module_1.default.find = createFindStub(modules);
        Module_1.default.findByIdAndUpdate = async () => { };
        let active = 0;
        let maxActive = 0;
        global.fetch = async () => {
            active++;
            maxActive = Math.max(maxActive, active);
            await new Promise((r) => setTimeout(r, 5));
            active--;
            return { ok: true };
        };
        (0, moduleOrchestrator_1.startModuleOrchestrator)({ intervalMs: 1000, maxConcurrentPings: 5 });
        await new Promise((r) => setTimeout(r, 200));
        (0, moduleOrchestrator_1.stopModuleOrchestrator)();
        strict_1.default.ok(maxActive <= 5);
    });
    (0, node_test_1.it)('throws if maxConcurrentPings is not positive in checkModules', async () => {
        await strict_1.default.rejects(() => (0, moduleOrchestrator_1.checkModules)(undefined, undefined, 0), {
            message: 'maxConcurrentPings must be a positive number',
        });
    });
    (0, node_test_1.it)('throws if pruneOfflineMs is not positive in checkModules', async () => {
        await strict_1.default.rejects(() => (0, moduleOrchestrator_1.checkModules)(0), {
            message: 'pruneOfflineMs must be a positive number',
        });
    });
    (0, node_test_1.it)('throws if pingTimeoutMs is not positive in checkModules', async () => {
        await strict_1.default.rejects(() => (0, moduleOrchestrator_1.checkModules)(undefined, 0), {
            message: 'pingTimeoutMs must be a positive number',
        });
    });
    (0, node_test_1.it)('throws if batchSize is not positive in checkModules', async () => {
        await strict_1.default.rejects(() => (0, moduleOrchestrator_1.checkModules)(undefined, undefined, undefined, 0), {
            message: 'batchSize must be a positive number',
        });
    });
    (0, node_test_1.it)('throws if pingPath is empty in checkModules', async () => {
        await strict_1.default.rejects(() => (0, moduleOrchestrator_1.checkModules)(undefined, undefined, undefined, undefined, ''), { message: 'pingPath must be a non-empty string' });
    });
    (0, node_test_1.it)('throws if intervalMs is not positive in startModuleOrchestrator', () => {
        strict_1.default.throws(() => (0, moduleOrchestrator_1.startModuleOrchestrator)({ intervalMs: 0 }), {
            message: 'intervalMs must be a positive number',
        });
    });
    (0, node_test_1.it)('throws if maxConcurrentPings is not positive in startModuleOrchestrator', () => {
        strict_1.default.throws(() => (0, moduleOrchestrator_1.startModuleOrchestrator)({ intervalMs: 1000, maxConcurrentPings: 0 }), { message: 'maxConcurrentPings must be a positive number' });
    });
    (0, node_test_1.it)('throws if pruneOfflineMs is not positive in startModuleOrchestrator', () => {
        strict_1.default.throws(() => (0, moduleOrchestrator_1.startModuleOrchestrator)({ intervalMs: 1000, pruneOfflineMs: 0 }), { message: 'pruneOfflineMs must be a positive number' });
    });
    (0, node_test_1.it)('throws if pingTimeoutMs is not positive in startModuleOrchestrator', () => {
        strict_1.default.throws(() => (0, moduleOrchestrator_1.startModuleOrchestrator)({ intervalMs: 1000, pingTimeoutMs: 0 }), { message: 'pingTimeoutMs must be a positive number' });
    });
    (0, node_test_1.it)('throws if batchSize is not positive in startModuleOrchestrator', () => {
        strict_1.default.throws(() => (0, moduleOrchestrator_1.startModuleOrchestrator)({ intervalMs: 1000, batchSize: 0 }), { message: 'batchSize must be a positive number' });
    });
    (0, node_test_1.it)('throws if pingPath is empty in startModuleOrchestrator', () => {
        strict_1.default.throws(() => (0, moduleOrchestrator_1.startModuleOrchestrator)({ intervalMs: 1000, pingPath: '' }), { message: 'pingPath must be a non-empty string' });
    });
    (0, node_test_1.it)('exposes last cycle metrics via getOrchestratorMetrics', async () => {
        const modules = [
            { _id: '1', endpoints: { rest: 'http://m1' }, lastHandshake: new Date() },
            { _id: '2', endpoints: { rest: 'http://m2' }, lastHandshake: new Date() },
        ];
        Module_1.default.find = createFindStub(modules);
        Module_1.default.findByIdAndUpdate = async () => { };
        // m1 online, m2 offline
        global.fetch = async (url) => ({ ok: String(url).includes('m1') });
        await (0, moduleOrchestrator_1.checkModules)();
        const m = (0, moduleOrchestrator_1.getOrchestratorMetrics)();
        strict_1.default.ok(m, 'metrics should be set');
        strict_1.default.equal(m === null || m === void 0 ? void 0 : m.online, 1);
        strict_1.default.equal(m === null || m === void 0 ? void 0 : m.offline, 1);
        strict_1.default.ok(typeof (m === null || m === void 0 ? void 0 : m.durationMs) === 'number');
        strict_1.default.ok(typeof (m === null || m === void 0 ? void 0 : m.timestamp) === 'string');
    });
});
