import * as rabbitmq from "../lib/rabbitmq";

export interface Event<T> {
  type: string;
  payload: T;
}

function genId(): string {
  // Usar Web Crypto si está disponible (Edge/Browser); fallback simple en otros entornos
  const g: any = globalThis as any;
  if (g?.crypto?.randomUUID) return g.crypto.randomUUID();
  // Fallback no-cryptográfico suficiente para nombres de cola efímeros
  return `${Date.now().toString(36)}.${Math.random().toString(36).slice(2)}`;
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
  const queue = `${type}.${genId()}`;
  await rabbitmq.subscribe(queue, rabbitmq.EXCHANGE_NAME, type, async (payload: T) => {
    await handler(payload);
  });
}
