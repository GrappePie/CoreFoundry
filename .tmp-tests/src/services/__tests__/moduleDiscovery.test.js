"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const strict_1 = __importDefault(require("node:assert/strict"));
const moduleDiscovery_1 = require("../moduleDiscovery");
const Module_1 = __importDefault(require("../../models/Module"));
const store = [];
(0, node_test_1.beforeEach)(() => {
    store.length = 0;
});
Module_1.default.create = async (doc) => {
    const moduleDoc = {
        ...doc,
        async save() {
            return this;
        },
    };
    store.push(moduleDoc);
    return moduleDoc;
};
Module_1.default.find = async () => store;
Module_1.default.findOne = async (query) => store.find((m) => m.name === query.name && m.ownerId === query.ownerId) || null;
(0, node_test_1.describe)('moduleDiscovery service', () => {
    (0, node_test_1.it)('registers modules and lists them', async () => {
        const { integrationToken } = await (0, moduleDiscovery_1.registerModule)({
            name: 'inventory',
            version: '1.0.0',
            ownerId: 'u1',
            manifest: {},
            endpoints: { rest: 'https://inventory.local/api' },
        });
        strict_1.default.equal(typeof integrationToken, 'string');
        const modules = await (0, moduleDiscovery_1.getModules)();
        strict_1.default.equal(modules.length, 1);
        strict_1.default.equal(modules[0].integrationToken, integrationToken);
    });
    (0, node_test_1.it)('updates manifest when module already exists for owner', async () => {
        const first = await (0, moduleDiscovery_1.registerModule)({
            name: 'inventory',
            version: '1.0.0',
            ownerId: 'u1',
            manifest: { a: 1 },
            endpoints: { rest: 'https://inventory.local/api' },
        });
        const second = await (0, moduleDiscovery_1.registerModule)({
            name: 'inventory',
            version: '1.0.1',
            ownerId: 'u1',
            manifest: { b: 2 },
            endpoints: { rest: 'https://inventory.local/api/v2' },
        });
        strict_1.default.equal(store.length, 1);
        strict_1.default.equal(second.integrationToken, first.integrationToken);
        strict_1.default.deepEqual(second.module.manifest, { b: 2 });
        strict_1.default.equal(second.module.version, '1.0.1');
    });
    (0, node_test_1.it)('rejects invalid rest endpoint URL', async () => {
        await strict_1.default.rejects(() => (0, moduleDiscovery_1.registerModule)({
            name: 'inventory',
            version: '1.0.0',
            ownerId: 'u1',
            manifest: {},
            endpoints: { rest: 'not-a-url' },
        }), /endpoints\.rest must be a valid URL/);
    });
});
