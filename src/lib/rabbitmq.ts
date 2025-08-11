import amqp from 'amqplib';
import Ajv from 'ajv';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
export const EXCHANGE_NAME = process.env.RABBITMQ_EXCHANGE || 'modules.exchange';
const ajv = new Ajv();
let channel: amqp.Channel;
let initialized = false;

async function initRabbit(): Promise<void> {
  if (initialized) return;
  const conn = await amqp.connect(RABBITMQ_URL);
  channel = await conn.createChannel();
  await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
  initialized = true;
}

/**
 * Conecta a RabbitMQ y guarda el canal
 */
export async function connectRabbit(): Promise<amqp.Channel> {
  await initRabbit();
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
  if (schema) {
    const validate = ajv.compile(schema);
    if (!validate(payload)) {
      throw new Error('Payload validation failed: ' + ajv.errorsText(validate.errors));
    }
  }
  const buffer = Buffer.from(JSON.stringify(payload));
  channel.publish(exchange, routingKey, buffer, { persistent: true });
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
  await channel.assertQueue(queue, { durable: true });
  await channel.bindQueue(queue, exchange, routingKey);
  channel.consume(queue, async (msg: amqp.ConsumeMessage | null) => {
    if (!msg) return;
    const content = JSON.parse(msg.content.toString());
    if (schema) {
      const validate = ajv.compile(schema);
      if (!validate(content)) {
        console.error('Invalid message payload:', ajv.errorsText(validate.errors));
        channel.nack(msg, false, false);
        return;
      }
    }
    try {
      await onMessage(content);
      channel.ack(msg);
    } catch (err) {
      console.error('Error handling message:', err);
      channel.nack(msg, false, false);
    }
  });
}
