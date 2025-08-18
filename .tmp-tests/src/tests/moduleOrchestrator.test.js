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
const moduleOrchestrator_1 = require("../services/moduleOrchestrator");
const Module_1 = __importDefault(require("../models/Module"));
const eventBus = __importStar(require("../messaging/eventBus"));
const emitted = [];
eventBus.publish = async (event, payload) => {
    emitted.push({ event, moduleId: payload === null || payload === void 0 ? void 0 : payload.moduleId });
};
let modules = [];
Module_1.default.find = (filter = {}) => ({
    sort: () => ({
        limit: (l) => Promise.resolve(modules
            .filter((m) => {
            var _a;
            return (((_a = filter.deletedAt) === null || _a === void 0 ? void 0 : _a.$exists) === false ? !('deletedAt' in m) : true) &&
                (!filter._id || Number(m._id) > Number(filter._id.$gt));
        })
            .sort((a, b) => String(a._id).localeCompare(String(b._id)))
            .slice(0, l)),
    }),
});
Module_1.default.findByIdAndUpdate = async (id, update) => {
    const mod = modules.find((m) => m._id === id);
    Object.assign(mod, update);
    return mod;
};
Module_1.default.deleteOne = async ({ _id }) => {
    const index = modules.findIndex((m) => m._id === _id);
    if (index !== -1)
        modules.splice(index, 1);
};
global.fetch = (url, { signal } = {}) => {
    if (String(url).includes('m1')) {
        return Promise.resolve({ ok: true });
    }
    if (String(url).includes('m2')) {
        return Promise.resolve({ ok: false });
    }
    if (String(url).includes('m3')) {
        return new Promise((_res, rej) => {
            signal === null || signal === void 0 ? void 0 : signal.addEventListener('abort', () => {
                const err = new Error('Aborted');
                err.name = 'AbortError';
                rej(err);
            });
        });
    }
    return Promise.resolve({ ok: false });
};
(0, node_test_1.describe)('moduleOrchestrator service', () => {
    (0, node_test_1.it)('updates module status, prunes offline modules and emits events', async () => {
        modules = [
            {
                _id: '1',
                endpoints: { rest: 'https://m1.local/api' },
                status: 'offline',
            },
            {
                _id: '2',
                endpoints: { rest: 'https://m2.local/api' },
                status: 'offline',
                lastHandshake: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
            },
            {
                _id: '3',
                endpoints: { rest: 'https://m3.local/api' },
                status: 'offline',
            },
        ];
        emitted.length = 0;
        await (0, moduleOrchestrator_1.checkModules)(30 * 24 * 60 * 60 * 1000, 50);
        strict_1.default.equal(modules.length, 2);
        const m1 = modules.find((m) => m._id === '1');
        const m3 = modules.find((m) => m._id === '3');
        (0, strict_1.default)(m1);
        (0, strict_1.default)(m3);
        strict_1.default.equal(m1.status, 'online');
        (0, strict_1.default)(m1.lastHandshake instanceof Date);
        strict_1.default.equal(m3.status, 'offline');
        strict_1.default.deepEqual(emitted.filter((e) => e.event !== 'orchestrator.cycle'), [
            { event: 'module.online', moduleId: '1' },
            { event: 'module.removed', moduleId: '2' },
        ]);
    });
    (0, node_test_1.it)('emits module.offline when ping URL is invalid', async () => {
        modules = [
            {
                _id: '4',
                endpoints: { rest: 'invalid-url' },
                status: 'online',
            },
        ];
        emitted.length = 0;
        await (0, moduleOrchestrator_1.checkModules)(undefined, 50);
        const m4 = modules.find((m) => m._id === '4');
        (0, strict_1.default)(m4);
        strict_1.default.equal(m4.status, 'offline');
        strict_1.default.deepEqual(emitted.filter((e) => e.event !== 'orchestrator.cycle'), [{ event: 'module.offline', moduleId: '4' }]);
    });
    (0, node_test_1.it)('does not emit module.offline for invalid URL when already offline', async () => {
        modules = [
            {
                _id: '5',
                endpoints: { rest: 'invalid-url' },
                status: 'offline',
            },
        ];
        emitted.length = 0;
        await (0, moduleOrchestrator_1.checkModules)(undefined, 50);
        const m5 = modules.find((m) => m._id === '5');
        (0, strict_1.default)(m5);
        strict_1.default.equal(m5.status, 'offline');
        strict_1.default.deepEqual(emitted.filter((e) => e.event !== 'orchestrator.cycle'), []);
    });
    (0, node_test_1.it)('does not process modules with deletedAt', async () => {
        modules = [
            {
                _id: '1',
                endpoints: { rest: 'https://m1.local/api' },
                status: 'offline',
            },
            {
                _id: '2',
                endpoints: { rest: 'https://m2.local/api' },
                status: 'offline',
                deletedAt: new Date(),
            },
        ];
        emitted.length = 0;
        await (0, moduleOrchestrator_1.checkModules)(undefined, 50);
        const m1 = modules.find((m) => m._id === '1');
        const m2 = modules.find((m) => m._id === '2');
        (0, strict_1.default)(m1);
        (0, strict_1.default)(m2);
        strict_1.default.equal(m1.status, 'online');
        strict_1.default.equal(m2.status, 'offline');
        strict_1.default.equal(m2.lastHandshake, undefined);
        strict_1.default.deepEqual(emitted.filter((e) => e.event !== 'orchestrator.cycle'), [{ event: 'module.online', moduleId: '1' }]);
    });
    (0, node_test_1.it)('limits parallel pings to maxConcurrentPings', async () => {
        modules = Array.from({ length: 20 }, (_, i) => ({
            _id: String(i + 1),
            endpoints: { rest: `https://m${i + 1}.local/api` },
            status: 'offline',
        }));
        const originalFetch = global.fetch;
        let active = 0;
        let maxActive = 0;
        global.fetch = async () => {
            active++;
            maxActive = Math.max(maxActive, active);
            await new Promise((r) => setTimeout(r, 10));
            active--;
            return { ok: true };
        };
        await (0, moduleOrchestrator_1.checkModules)(undefined, undefined, 5);
        strict_1.default.ok(maxActive <= 5);
        global.fetch = originalFetch;
    });
});
