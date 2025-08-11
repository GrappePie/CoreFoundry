import Broker from "../lib/broker";

export interface Event<T> {
  type: string;
  payload: T;
}

const broker = new Broker();

/**
 * Publish an event using the underlying Broker instance.
 */
export function publish<T>(type: string, payload: T): Promise<void> {
  return broker.publish(type, payload);
}

/**
 * Subscribe to a given event type.
 */
export function subscribe<T>(
  type: string,
  handler: (payload: T) => Promise<void> | void,
): void {
  broker.subscribe(type, handler);
}
