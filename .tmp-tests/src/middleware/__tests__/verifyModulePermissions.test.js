"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const strict_1 = __importDefault(require("node:assert/strict"));
const mongoose_1 = __importDefault(require("mongoose"));
const Module_1 = __importDefault(require("../../models/Module"));
const auth_1 = require("../auth");
process.env.MONGODB_URI = 'mongodb://localhost/test';
node_test_1.mock.method(mongoose_1.default, 'connect', async () => mongoose_1.default);
function makeRequest(headers = {}) {
    const store = {};
    for (const [k, v] of Object.entries(headers)) {
        store[k.toLowerCase()] = v;
    }
    return {
        headers: {
            get: (key) => { var _a; return (_a = store[key.toLowerCase()]) !== null && _a !== void 0 ? _a : null; },
        },
    };
}
(0, node_test_1.describe)('verifyModulePermissions', () => {
    (0, node_test_1.it)('returns 401 when X-Module-Id is missing', async () => {
        const res = await (0, auth_1.verifyModulePermissions)(makeRequest());
        strict_1.default.equal(res.status, 401);
    });
    (0, node_test_1.it)('returns 404 for invalid module id', async (t) => {
        t.mock.method(Module_1.default, 'findById', async () => { throw new Error('CastError'); });
        const res = await (0, auth_1.verifyModulePermissions)(makeRequest({
            'x-module-id': 'invalid',
            'x-module-scopes': 'auth:login',
        }));
        strict_1.default.equal(res.status, 404);
    });
    (0, node_test_1.it)('returns 404 when module does not exist', async (t) => {
        t.mock.method(Module_1.default, 'findById', async () => null);
        const res = await (0, auth_1.verifyModulePermissions)(makeRequest({
            'x-module-id': new mongoose_1.default.Types.ObjectId().toString(),
            'x-module-scopes': 'auth:login',
        }));
        strict_1.default.equal(res.status, 404);
    });
    (0, node_test_1.it)('returns 401 when X-Module-Scopes is missing', async (t) => {
        t.mock.method(Module_1.default, 'findById', async () => ({ permissions: ['auth:login'] }));
        const res = await (0, auth_1.verifyModulePermissions)(makeRequest({
            'x-module-id': new mongoose_1.default.Types.ObjectId().toString(),
        }));
        strict_1.default.equal(res.status, 401);
    });
    (0, node_test_1.it)('returns 403 when required permissions are missing', async (t) => {
        t.mock.method(Module_1.default, 'findById', async () => ({ permissions: [] }));
        const res = await (0, auth_1.verifyModulePermissions)(makeRequest({
            'x-module-id': new mongoose_1.default.Types.ObjectId().toString(),
            'x-module-scopes': 'auth:login',
        }));
        strict_1.default.equal(res.status, 403);
    });
    (0, node_test_1.it)('allows request when permissions are satisfied', async (t) => {
        t.mock.method(Module_1.default, 'findById', async () => ({ permissions: ['auth:login'] }));
        const res = await (0, auth_1.verifyModulePermissions)(makeRequest({
            'x-module-id': new mongoose_1.default.Types.ObjectId().toString(),
            'x-module-scopes': 'auth:login',
        }));
        strict_1.default.equal(res.status, 200);
    });
});
