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
const rabbitmq = __importStar(require("../../lib/rabbitmq"));
const eventBus_1 = require("../eventBus");
(0, node_test_1.describe)('eventBus', () => {
    (0, node_test_1.it)('delivers published events to subscribers', async (t) => {
        const handlers = new Map();
        t.mock.method(rabbitmq, 'subscribe', async (queue, exchange, routingKey, onMessage) => {
            handlers.set(routingKey, onMessage);
        });
        t.mock.method(rabbitmq, 'publish', async (exchange, routingKey, payload) => {
            const handler = handlers.get(routingKey);
            if (handler)
                await handler(payload);
        });
        const payload = { foo: 'bar' };
        let received;
        await (0, eventBus_1.subscribe)('test.event', (data) => {
            received = data;
        });
        await (0, eventBus_1.publish)('test.event', payload);
        strict_1.default.deepEqual(received, payload);
    });
    (0, node_test_1.it)('resolves publish promise after async handlers', async (t) => {
        const handlers = new Map();
        t.mock.timers.enable();
        t.mock.method(rabbitmq, 'subscribe', async (queue, exchange, routingKey, onMessage) => {
            handlers.set(routingKey, onMessage);
        });
        t.mock.method(rabbitmq, 'publish', async (exchange, routingKey, payload) => {
            const handler = handlers.get(routingKey);
            if (handler)
                await handler(payload);
        });
        let handled = false;
        await (0, eventBus_1.subscribe)('async.event', async () => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            handled = true;
        });
        const publishPromise = (0, eventBus_1.publish)('async.event', {});
        t.mock.timers.tick(10);
        await publishPromise;
        strict_1.default.equal(handled, true);
    });
});
