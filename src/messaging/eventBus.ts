import { randomUUID } from "crypto";
import * as rabbitmq from "../lib/rabbitmq";

export interface Event<T> {
  type: string;
  payload: T;
}

/**
 * Publish an event to the default exchange.
 */
export async function publish<T>(type: string, payload: T): Promise<void> {
  await rabbitmq.publish(rabbitmq.EXCHANGE_NAME, type, payload);
}

/**
 * Subscribe to a given event type using a unique queue per subscriber.
 */
export async function subscribe<T>(
  type: string,
  handler: (payload: T) => Promise<void> | void,
): Promise<void> {
  const queue = `${type}.${randomUUID()}`;
  await rabbitmq.subscribe(queue, rabbitmq.EXCHANGE_NAME, type, async (payload: T) => {
    await handler(payload);
  });
}
