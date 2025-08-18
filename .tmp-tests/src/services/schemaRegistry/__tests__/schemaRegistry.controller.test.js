"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const strict_1 = __importDefault(require("node:assert/strict"));
const schemaRegistry_controller_1 = require("../schemaRegistry.controller");
const schemaDefinition_model_1 = __importDefault(require("../schemaDefinition.model"));
// In-memory store to mock database operations
const store = [];
schemaDefinition_model_1.default.create = async (doc) => {
    store.push(doc);
    return doc;
};
schemaDefinition_model_1.default.find = async () => store;
(0, node_test_1.describe)('schemaRegistry.controller', () => {
    (0, node_test_1.it)('creates and retrieves schemas', async () => {
        const reqPost = new Request('http://test/schemas', {
            method: 'POST',
            body: JSON.stringify({ $id: 'test-schema', version: '1.0.0', schema: { type: 'object' } }),
        });
        const resPost = await (0, schemaRegistry_controller_1.POST)(reqPost);
        strict_1.default.equal(resPost.status, 201);
        const reqGet = new Request('http://test/schemas');
        const resGet = await (0, schemaRegistry_controller_1.GET)(reqGet);
        const data = await resGet.json();
        strict_1.default.equal(Array.isArray(data), true);
        strict_1.default.equal(data.length, 1);
        strict_1.default.equal(data[0].schemaId, 'test-schema');
    });
});
