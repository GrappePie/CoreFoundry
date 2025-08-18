"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const strict_1 = __importDefault(require("node:assert/strict"));
const broker_1 = __importDefault(require("./broker"));
// Tests for Broker behaviors
(0, node_test_1.describe)('Broker', () => {
    (0, node_test_1.it)('delivers messages to subscribers', async () => {
        const broker = new broker_1.default();
        const payload = { value: 42 };
        let received;
        broker.subscribe('topic', (msg) => {
            received = msg;
        });
        await broker.publish('topic', payload);
        strict_1.default.deepEqual(received, payload);
    });
    (0, node_test_1.it)('resolves publish promise when async handler acknowledges', async (t) => {
        const broker = new broker_1.default();
        let handled = false;
        t.mock.timers.enable();
        broker.subscribe('async', async () => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            handled = true;
        });
        const publishPromise = broker.publish('async', 'data');
        t.mock.timers.tick(10);
        await publishPromise;
        strict_1.default.equal(handled, true);
    });
    (0, node_test_1.it)('retries handler on failure up to maxRetries', async (t) => {
        const broker = new broker_1.default({ maxRetries: 2, retryDelayMs: 100 });
        let attempts = 0;
        t.mock.timers.enable();
        broker.subscribe('retry', () => {
            attempts += 1;
            if (attempts <= 2) {
                throw new Error('fail');
            }
        });
        const publishPromise = broker.publish('retry', 'payload');
        strict_1.default.equal(attempts, 1);
        t.mock.timers.tick(100); // first retry
        strict_1.default.equal(attempts, 2);
        t.mock.timers.tick(100); // second retry, should succeed
        await publishPromise;
        strict_1.default.equal(attempts, 3);
    });
    (0, node_test_1.it)('sends message to DLQ after exceeding retries', async (t) => {
        const broker = new broker_1.default({ maxRetries: 1, retryDelayMs: 100 });
        let dlqPayload;
        let dlqError;
        let attempts = 0;
        t.mock.timers.enable();
        broker.subscribe('fail', () => {
            attempts += 1;
            throw new Error('boom');
        });
        broker.onDeadLetter('fail', (payload, error) => {
            dlqPayload = payload;
            dlqError = error;
        });
        const publishPromise = broker.publish('fail', 'task');
        t.mock.timers.tick(100); // retry
        await publishPromise;
        strict_1.default.equal(attempts, 2); // initial + 1 retry
        strict_1.default.equal(dlqPayload, 'task');
        (0, strict_1.default)(dlqError instanceof Error);
    });
});
