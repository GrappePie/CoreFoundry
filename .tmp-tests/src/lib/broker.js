"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const crypto_1 = require("crypto");
/**
 * Simple in-memory message broker that supports acknowledgements, retries and
 * a dead-letter queue.
 *
 * This implementation is intended for lightweight, single-process scenarios
 * such as tests or local development. Messages are kept only in memory and the
 * broker does not provide any concurrency guarantees beyond Node's event loop;
 * it should not be used across multiple processes or where durability is
 * required.
 */
class Broker {
    constructor(options = {}) {
        var _a, _b;
        this.emitter = new events_1.EventEmitter();
        this.maxRetries = (_a = options.maxRetries) !== null && _a !== void 0 ? _a : 3;
        this.retryDelay = (_b = options.retryDelayMs) !== null && _b !== void 0 ? _b : 1000;
    }
    /**
     * Publish a message to a topic and wait for it to be acknowledged.
     */
    publish(topic, payload) {
        return new Promise((resolve) => {
            const msg = {
                id: (0, crypto_1.randomUUID)(),
                payload,
                attempt: 0,
                resolve,
            };
            this.emitter.emit(topic, msg);
        });
    }
    /**
     * Subscribe to a topic with a handler that processes incoming messages.
     *
     * The handler can be synchronous or return a promise. Any exception thrown
     * or promise rejection is captured and will cause the message to be retried
     * until {@link BrokerOptions.maxRetries} is reached. When the retry limit is
     * exceeded, the message is forwarded to the dead-letter queue and the error
     * is passed to registered {@link onDeadLetter} handlers.
     */
    subscribe(topic, handler) {
        this.emitter.on(topic, async (msg) => {
            try {
                await handler(msg.payload);
                msg.resolve();
            }
            catch (err) {
                if (msg.attempt >= this.maxRetries) {
                    this.emitter.emit(`${topic}:dlq`, msg.payload, err);
                    msg.resolve();
                    return;
                }
                const retry = {
                    ...msg,
                    attempt: msg.attempt + 1,
                };
                setTimeout(() => this.emitter.emit(topic, retry), this.retryDelay);
            }
        });
    }
    /**
     * Listen for messages that ended up in the dead‑letter queue for a topic.
     */
    onDeadLetter(topic, handler) {
        this.emitter.on(`${topic}:dlq`, handler);
    }
}
exports.default = Broker;
