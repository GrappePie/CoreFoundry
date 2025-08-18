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
const Module_1 = __importDefault(require("../models/Module"));
const moduleOrchestrator_1 = require("../services/moduleOrchestrator");
const eventBus = __importStar(require("../messaging/eventBus"));
const emitted = [];
eventBus.publish = async (event, payload) => {
    emitted.push({ event, moduleId: payload === null || payload === void 0 ? void 0 : payload.moduleId });
};
const wait = (ms) => new Promise((res) => setTimeout(res, ms));
function createFindStub(modules, opts = {}) {
    return (query = {}) => {
        var _a;
        (_a = opts.onCall) === null || _a === void 0 ? void 0 : _a.call(opts);
        return {
            sort: () => ({
                limit: (l) => {
                    const filtered = modules
                        .filter((m) => !query._id || Number(m._id) > Number(query._id.$gt))
                        .sort((a, b) => String(a._id).localeCompare(String(b._id)))
                        .slice(0, l);
                    return Promise.resolve(filtered);
                },
            }),
        };
    };
}
(0, node_test_1.beforeEach)(async () => {
    (0, moduleOrchestrator_1.stopModuleOrchestrator)();
    await wait(50);
    emitted.length = 0;
});
(0, node_test_1.describe)('module orchestrator cycle control', () => {
    (0, node_test_1.it)('runs without overlapping cycles', async () => {
        let running = 0;
        let maxRunning = 0;
        let calls = 0;
        Module_1.default.find = () => ({
            sort: () => ({
                limit: async () => {
                    running++;
                    maxRunning = Math.max(maxRunning, running);
                    await wait(80);
                    running--;
                    calls++;
                    return [];
                },
            }),
        });
        (0, moduleOrchestrator_1.startModuleOrchestrator)({ intervalMs: 10 });
        await wait(5);
        strict_1.default.equal(running, 1);
        await wait(195);
        (0, moduleOrchestrator_1.stopModuleOrchestrator)();
        await wait(100);
        strict_1.default.equal(maxRunning, 1);
        strict_1.default.ok(calls >= 3);
    });
    (0, node_test_1.it)('recovers and schedules new cycle after errors', async () => {
        let calls = 0;
        Module_1.default.find = () => ({
            sort: () => ({
                limit: async () => {
                    calls++;
                    if (calls === 1)
                        throw new Error('fail');
                    return [];
                },
            }),
        });
        (0, moduleOrchestrator_1.startModuleOrchestrator)({ intervalMs: 10 });
        await wait(1);
        strict_1.default.equal(calls, 1);
        await wait(120);
        (0, moduleOrchestrator_1.stopModuleOrchestrator)();
        await wait(50);
        strict_1.default.ok(calls >= 2);
    });
    (0, node_test_1.it)('stops scheduling when stopped mid-cycle', async () => {
        let calls = 0;
        Module_1.default.find = () => ({
            sort: () => ({
                limit: async () => {
                    calls++;
                    await wait(50);
                    return [];
                },
            }),
        });
        (0, moduleOrchestrator_1.startModuleOrchestrator)({ intervalMs: 10 });
        await wait(5);
        (0, moduleOrchestrator_1.stopModuleOrchestrator)();
        await wait(100);
        strict_1.default.equal(calls, 1);
    });
    (0, node_test_1.it)('emits module.online only when status changes', async () => {
        const originalFind = Module_1.default.find;
        const originalFindByIdAndUpdate = Module_1.default.findByIdAndUpdate;
        const originalFetch = global.fetch;
        try {
            const modules = [
                {
                    _id: '1',
                    endpoints: { rest: 'https://m1.local/api' },
                    status: 'offline',
                },
            ];
            Module_1.default.find = createFindStub(modules);
            Module_1.default.findByIdAndUpdate = async (id, update) => {
                const mod = modules.find((m) => m._id === id);
                Object.assign(mod, update);
                return mod;
            };
            const fetched = [];
            global.fetch = async (url) => {
                fetched.push(String(url));
                return { ok: true };
            };
            await (0, moduleOrchestrator_1.checkModules)(undefined, 50);
            strict_1.default.equal(fetched[0], 'https://m1.local/api/ping');
            strict_1.default.deepEqual(emitted.filter((e) => e.event !== 'orchestrator.cycle'), [{ event: 'module.online', moduleId: '1' }]);
            emitted.length = 0;
            fetched.length = 0;
            await (0, moduleOrchestrator_1.checkModules)(undefined, 50);
            strict_1.default.equal(fetched[0], 'https://m1.local/api/ping');
            strict_1.default.deepEqual(emitted.filter((e) => e.event !== 'orchestrator.cycle'), []);
        }
        finally {
            Module_1.default.find = originalFind;
            Module_1.default.findByIdAndUpdate = originalFindByIdAndUpdate;
            global.fetch = originalFetch;
        }
    });
    (0, node_test_1.it)('emits module.offline only when status changes', async () => {
        const originalFind = Module_1.default.find;
        const originalFindByIdAndUpdate = Module_1.default.findByIdAndUpdate;
        const originalFetch = global.fetch;
        try {
            const modules = [
                {
                    _id: '1',
                    endpoints: { rest: 'https://m1.local/api' },
                    status: 'online',
                },
            ];
            Module_1.default.find = createFindStub(modules);
            Module_1.default.findByIdAndUpdate = async (id, update) => {
                const mod = modules.find((m) => m._id === id);
                Object.assign(mod, update);
                return mod;
            };
            global.fetch = async () => ({ ok: false });
            await (0, moduleOrchestrator_1.checkModules)(undefined, 50);
            strict_1.default.deepEqual(emitted.filter((e) => e.event !== 'orchestrator.cycle'), [{ event: 'module.offline', moduleId: '1' }]);
            emitted.length = 0;
            await (0, moduleOrchestrator_1.checkModules)(undefined, 50);
            strict_1.default.deepEqual(emitted.filter((e) => e.event !== 'orchestrator.cycle'), []);
        }
        finally {
            Module_1.default.find = originalFind;
            Module_1.default.findByIdAndUpdate = originalFindByIdAndUpdate;
            global.fetch = originalFetch;
        }
    });
    (0, node_test_1.it)('removes modules exceeding pruneOfflineMs and emits module.removed', async () => {
        const originalFind = Module_1.default.find;
        const originalDeleteOne = Module_1.default.deleteOne;
        const originalFetch = global.fetch;
        try {
            const modules = [
                { _id: '1', endpoints: { rest: 'https://m1.local/api' }, lastHandshake: new Date(0) },
            ];
            Module_1.default.find = createFindStub(modules);
            const deleted = [];
            Module_1.default.deleteOne = async (query) => {
                deleted.push(String(query._id));
            };
            Module_1.default.findByIdAndUpdate = async () => {
                throw new Error('should not update');
            };
            global.fetch = async () => ({ ok: false });
            await (0, moduleOrchestrator_1.checkModules)(1, 50);
            strict_1.default.deepEqual(deleted, ['1']);
            strict_1.default.deepEqual(emitted.filter((e) => e.event !== 'orchestrator.cycle'), [{ event: 'module.removed', moduleId: '1' }]);
        }
        finally {
            Module_1.default.find = originalFind;
            Module_1.default.deleteOne = originalDeleteOne;
            global.fetch = originalFetch;
        }
    });
    (0, node_test_1.it)('marks module offline and emits module.offline for invalid ping URL', async () => {
        const originalFind = Module_1.default.find;
        const originalFindByIdAndUpdate = Module_1.default.findByIdAndUpdate;
        try {
            const modules = [
                {
                    _id: '1',
                    endpoints: { rest: 'badurl' },
                    status: 'online',
                    lastHandshake: undefined,
                },
            ];
            Module_1.default.find = createFindStub(modules);
            Module_1.default.findByIdAndUpdate = async (id, update) => {
                const mod = modules.find((m) => m._id === id);
                Object.assign(mod, update);
                return mod;
            };
            await (0, moduleOrchestrator_1.checkModules)(undefined, 50);
            strict_1.default.equal(modules[0].status, 'offline');
            strict_1.default.ok(modules[0].lastHandshake instanceof Date);
            strict_1.default.deepEqual(emitted.filter((e) => e.event !== 'orchestrator.cycle'), [{ event: 'module.offline', moduleId: '1' }]);
        }
        finally {
            Module_1.default.find = originalFind;
            Module_1.default.findByIdAndUpdate = originalFindByIdAndUpdate;
        }
    });
});
