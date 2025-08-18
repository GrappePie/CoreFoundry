"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const strict_1 = __importDefault(require("node:assert/strict"));
const mongoose_1 = __importDefault(require("mongoose"));
const Module_1 = __importDefault(require("../../models/Module"));
const moduleManifest_1 = require("../moduleManifest");
const schemaDefinition_model_1 = __importDefault(require("../../services/schemaRegistry/schemaDefinition.model"));
// Helper to run Mongoose pre-save hooks without DB
function runPreSave(doc) {
    return new Promise((resolve, reject) => {
        doc.constructor.schema.s.hooks.execPre('save', doc, (err) => {
            if (err)
                reject(err);
            else
                resolve();
        });
    });
}
(0, node_test_1.describe)('validateManifest', () => {
    (0, node_test_1.it)('accepts valid manifest with optional fields', () => {
        const manifest = {
            name: 'inventory',
            version: '1.0.0',
            description: 'Inventory module',
            endpoints: { rest: '/api/inventory', ws: '/ws/inventory' },
            schemas: { item: { type: 'object' } },
            dependencies: ['users'],
            events: { publish: ['item.updated'], subscribe: ['user.created'] },
        };
        strict_1.default.equal((0, moduleManifest_1.validateManifest)(manifest), true);
    });
    (0, node_test_1.it)('rejects manifest missing required fields', () => {
        const manifest = {
            version: '1.0.0',
            endpoints: { rest: '/api' },
            schemas: {},
        };
        strict_1.default.equal((0, moduleManifest_1.validateManifest)(manifest), false);
    });
    (0, node_test_1.it)('rejects manifest with invalid types', () => {
        const manifest = {
            name: 'test',
            version: 1,
            endpoints: { rest: '/api' },
            schemas: {},
        };
        strict_1.default.equal((0, moduleManifest_1.validateManifest)(manifest), false);
    });
    (0, node_test_1.it)('rejects manifest with unexpected properties', () => {
        const manifest = {
            name: 'test',
            version: '1.0.0',
            endpoints: { rest: '/api' },
            schemas: {},
            extra: true,
        };
        strict_1.default.equal((0, moduleManifest_1.validateManifest)(manifest), false);
    });
    (0, node_test_1.it)('rejects manifest with malformed nested events', () => {
        const manifest = {
            name: 'test',
            version: '1.0.0',
            endpoints: { rest: '/api' },
            schemas: {},
            events: { publish: 'not-array' },
        };
        strict_1.default.equal((0, moduleManifest_1.validateManifest)(manifest), false);
    });
    (0, node_test_1.it)('rejects manifest with non-object schemas', () => {
        const manifest = {
            name: 'test',
            version: '1.0.0',
            endpoints: { rest: '/api' },
            schemas: 'invalid',
        };
        strict_1.default.equal((0, moduleManifest_1.validateManifest)(manifest), false);
    });
});
// Stub schema registry to avoid DB interactions during tests
schemaDefinition_model_1.default.updateOne = async () => { };
(0, node_test_1.describe)('ModuleSchema pre-save', () => {
    (0, node_test_1.it)('allows saving with valid manifest', async () => {
        const manifest = {
            name: 'inventory',
            version: '1.0.0',
            endpoints: { rest: '/api/inventory' },
            schemas: {},
        };
        const mod = new Module_1.default({
            name: 'inventory',
            version: '1.0.0',
            description: '',
            ownerId: new mongoose_1.default.Types.ObjectId(),
            manifest,
            endpoints: { rest: '/api/inventory' },
            integrationToken: 'token',
        });
        await runPreSave(mod); // should not throw
    });
    (0, node_test_1.it)('rejects invalid manifest during save', async () => {
        const manifest = {
            name: 'inventory',
            version: '1.0.0',
            endpoints: { rest: '/api/inventory' },
            schemas: 'invalid',
        };
        const mod = new Module_1.default({
            name: 'inventory',
            version: '1.0.0',
            description: '',
            ownerId: new mongoose_1.default.Types.ObjectId(),
            manifest,
            endpoints: { rest: '/api/inventory' },
            integrationToken: 'token',
        });
        await strict_1.default.rejects(runPreSave(mod), /Invalid module manifest/);
    });
});
(0, node_test_1.describe)('approveManifest schema key mismatch', () => {
    (0, node_test_1.it)('rejects manifest when key differs from $id and persists by $id', async () => {
        let captured = null;
        schemaDefinition_model_1.default.updateOne = async (query) => {
            captured = query;
        };
        const manifest = {
            name: 'inventory',
            version: '1.0.0',
            endpoints: { rest: '/api' },
            schemas: { wrong: { $id: 'right', type: 'object' } },
        };
        const result = await (0, moduleManifest_1.approveManifest)(manifest);
        strict_1.default.equal(result, false);
        strict_1.default.equal(captured.schemaId, 'right');
    });
});
