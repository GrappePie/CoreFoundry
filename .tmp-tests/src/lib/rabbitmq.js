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
exports.EXCHANGE_NAME = void 0;
exports.connectRabbit = connectRabbit;
exports.assertExchange = assertExchange;
exports.publish = publish;
exports.subscribe = subscribe;
const amqp = __importStar(require("amqplib"));
const ajv_1 = __importDefault(require("ajv"));
const logger_1 = __importDefault(require("./logger"));
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
exports.EXCHANGE_NAME = process.env.RABBITMQ_EXCHANGE || 'modules.exchange';
const RABBITMQ_DISABLED = String(process.env.RABBITMQ_DISABLED || '').toLowerCase() === 'true';
const ajv = new ajv_1.default();
let channel;
let connection;
let initialized = false;
let initializing = null;
async function connectWithRetry(maxRetries = 3) {
    let attempt = 0;
    let lastErr;
    const delays = [500, 1000, 2000];
    while (attempt <= maxRetries) {
        try {
            const conn = await amqp.connect(RABBITMQ_URL);
            return conn;
        }
        catch (err) {
            lastErr = err;
            if (attempt === maxRetries)
                break;
            const delay = delays[Math.min(attempt, delays.length - 1)];
            logger_1.default.error(`RabbitMQ connect failed (attempt ${attempt + 1}/${maxRetries + 1})`, err);
            await new Promise((r) => setTimeout(r, delay));
            attempt++;
        }
    }
    throw lastErr instanceof Error ? lastErr : new Error('RabbitMQ connect failed');
}
async function initRabbit() {
    if (RABBITMQ_DISABLED) {
        // No-op mode: no conexión, no errores
        initialized = false;
        return;
    }
    if (initialized)
        return;
    if (initializing)
        return initializing;
    initializing = (async () => {
        try {
            const conn = await connectWithRetry();
            connection = conn;
            conn.on('close', () => {
                logger_1.default.error('RabbitMQ connection closed; will reinitialize on next publish/subscribe');
                initialized = false;
                channel = undefined;
                connection = undefined;
            });
            conn.on('error', (err) => {
                logger_1.default.error('RabbitMQ connection error', err);
                initialized = false;
            });
            const ch = await conn.createChannel();
            await ch.assertExchange(exports.EXCHANGE_NAME, 'topic', { durable: true });
            channel = ch;
            initialized = true;
            logger_1.default.info(`RabbitMQ connected to ${new URL(RABBITMQ_URL).host}, exchange=${exports.EXCHANGE_NAME}`);
        }
        finally {
            initializing = null;
        }
    })();
    return initializing;
}
/**
 * Conecta a RabbitMQ y guarda el canal
 */
async function connectRabbit() {
    await initRabbit();
    if (!channel) {
        throw new Error('RabbitMQ channel not available');
    }
    return channel;
}
/**
 * Asegura un exchange (tipo topic por defecto)
 */
async function assertExchange(exchange, type = 'topic') {
    await initRabbit();
    if (RABBITMQ_DISABLED)
        return;
    if (!channel)
        throw new Error('RabbitMQ channel not available');
    await channel.assertExchange(exchange, type, { durable: true });
}
/**
 * Publica un mensaje en un exchange con validación opcional por esquema AJV
 */
async function publish(exchange, routingKey, payload, schema) {
    await initRabbit();
    if (RABBITMQ_DISABLED)
        return;
    if (schema) {
        const validate = ajv.compile(schema);
        if (!validate(payload)) {
            throw new Error('Payload validation failed: ' + ajv.errorsText(validate.errors));
        }
    }
    if (!channel)
        throw new Error('RabbitMQ channel not available');
    const buffer = Buffer.from(JSON.stringify(payload));
    const ok = channel.publish(exchange, routingKey, buffer, { persistent: true });
    if (!ok) {
        // backpressure: esperar al siguiente tick compatible con Edge
        await new Promise((r) => setTimeout(r, 0));
    }
}
/**
 * Suscribe a un queue unido a un exchange y routingKey, con validación opcional
 */
async function subscribe(queue, exchange, routingKey, onMessage, schema) {
    await initRabbit();
    if (RABBITMQ_DISABLED)
        return;
    if (!channel)
        throw new Error('RabbitMQ channel not available');
    await channel.assertQueue(queue, { durable: true });
    await channel.bindQueue(queue, exchange, routingKey);
    channel.consume(queue, async (msg) => {
        if (!msg)
            return;
        const content = JSON.parse(msg.content.toString());
        if (schema) {
            const validate = ajv.compile(schema);
            if (!validate(content)) {
                logger_1.default.error('Invalid message payload:', ajv.errorsText(validate.errors));
                channel.nack(msg, false, false);
                return;
            }
        }
        try {
            await onMessage(content);
            channel.ack(msg);
        }
        catch (err) {
            logger_1.default.error('Error handling message:', err);
            channel.nack(msg, false, false);
        }
    });
}
