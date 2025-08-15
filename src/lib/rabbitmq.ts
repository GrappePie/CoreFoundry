import * as amqp from 'amqplib';
import type { Connection, Channel, ConsumeMessage } from 'amqplib';
import Ajv from 'ajv';
import logger from './logger';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
export const EXCHANGE_NAME = process.env.RABBITMQ_EXCHANGE || 'modules.exchange';
const RABBITMQ_DISABLED = String(process.env.RABBITMQ_DISABLED || '').toLowerCase() === 'true';

const ajv = new Ajv();
let channel: Channel | undefined;
let connection: Connection | undefined;
let initialized = false;
let initializing: Promise<void> | null = null;

async function connectWithRetry(maxRetries = 3): Promise<Connection> {
  let attempt = 0;
  let lastErr: unknown;
  const delays = [500, 1000, 2000];
  while (attempt <= maxRetries) {
    try {
      const conn: Connection = await amqp.connect(RABBITMQ_URL) as unknown as Connection;
      return conn;
    } catch (err) {
      lastErr = err;
      if (attempt === maxRetries) break;
      const delay = delays[Math.min(attempt, delays.length - 1)];
      logger.error(`RabbitMQ connect failed (attempt ${attempt + 1}/${maxRetries + 1})`, err);
      await new Promise((r) => setTimeout(r, delay));
      attempt++;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('RabbitMQ connect failed');
}

async function initRabbit(): Promise<void> {
  if (RABBITMQ_DISABLED) {
    // No-op mode: no conexión, no errores
    initialized = false;
    return;
  }
  if (initialized) return;
  if (initializing) return initializing;
  initializing = (async () => {
    try {
      const conn = await connectWithRetry();
      connection = conn;
      conn.on('close', () => {
        logger.error('RabbitMQ connection closed; will reinitialize on next publish/subscribe');
        initialized = false;
        channel = undefined;
        connection = undefined;
      });
      conn.on('error', (err: unknown) => {
        logger.error('RabbitMQ connection error', err);
        initialized = false;
      });
      const ch: Channel = await (conn as any).createChannel();
      await ch.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
      channel = ch;
      initialized = true;
      logger.info(`RabbitMQ connected to ${new URL(RABBITMQ_URL).host}, exchange=${EXCHANGE_NAME}`);
    } finally {
      initializing = null;
    }
  })();
  return initializing;
}

/**
 * Conecta a RabbitMQ y guarda el canal
 */
export async function connectRabbit(): Promise<Channel> {
  await initRabbit();
  if (!channel) {
    throw new Error('RabbitMQ channel not available');
  }
  return channel;
}

/**
 * Asegura un exchange (tipo topic por defecto)
 */
export async function assertExchange(
  exchange: string,
  type: string = 'topic'
): Promise<void> {
  await initRabbit();
  if (RABBITMQ_DISABLED) return;
  if (!channel) throw new Error('RabbitMQ channel not available');
  await channel.assertExchange(exchange, type, { durable: true });
}

/**
 * Publica un mensaje en un exchange con validación opcional por esquema AJV
 */
export async function publish(
  exchange: string,
  routingKey: string,
  payload: any,
  schema?: object
): Promise<void> {
  await initRabbit();
  if (RABBITMQ_DISABLED) return;
  if (schema) {
    const validate = ajv.compile(schema);
    if (!validate(payload)) {
      throw new Error('Payload validation failed: ' + ajv.errorsText(validate.errors));
    }
  }
  if (!channel) throw new Error('RabbitMQ channel not available');
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
export async function subscribe(
  queue: string,
  exchange: string,
  routingKey: string,
  onMessage: (payload: any) => Promise<void>,
  schema?: object
): Promise<void> {
  await initRabbit();
  if (RABBITMQ_DISABLED) return;
  if (!channel) throw new Error('RabbitMQ channel not available');
  await channel.assertQueue(queue, { durable: true });
  await channel.bindQueue(queue, exchange, routingKey);
  channel.consume(queue, async (msg: ConsumeMessage | null) => {
    if (!msg) return;
    const content = JSON.parse(msg.content.toString());
    if (schema) {
      const validate = ajv.compile(schema);
      if (!validate(content)) {
        logger.error('Invalid message payload:', ajv.errorsText(validate.errors));
        channel!.nack(msg, false, false);
        return;
      }
    }
    try {
      await onMessage(content);
      channel!.ack(msg);
    } catch (err) {
      logger.error('Error handling message:', err);
      channel!.nack(msg, false, false);
    }
  });
}
