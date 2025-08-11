import { EventEmitter } from "events";
import { randomUUID } from "crypto";

/**
 * Configuration options for {@link Broker}.
 */
interface BrokerOptions {
  /**
   * Maximum number of times a failing handler will be retried before the
   * message is forwarded to the dead-letter queue. Defaults to `3`.
   */
  maxRetries?: number;
  /**
   * Delay in milliseconds before attempting to process a failed message
   * again. Defaults to `1000` ms.
   */
  retryDelayMs?: number;
}

type Handler<T> = (payload: T) => Promise<void> | void;

interface Message<T> {
  id: string;
  payload: T;
  attempt: number;
  resolve: () => void;
}

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
  private emitter = new EventEmitter();
  private maxRetries: number;
  private retryDelay: number;

  constructor(options: BrokerOptions = {}) {
    this.maxRetries = options.maxRetries ?? 3;
    this.retryDelay = options.retryDelayMs ?? 1000;
  }

  /**
   * Publish a message to a topic and wait for it to be acknowledged.
   */
  publish<T>(topic: string, payload: T): Promise<void> {
    return new Promise((resolve) => {
      const msg: Message<T> = {
        id: randomUUID(),
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
  subscribe<T>(topic: string, handler: Handler<T>): void {
    this.emitter.on(topic, async (msg: Message<T>) => {
      try {
        await handler(msg.payload);
        msg.resolve();
      } catch (err) {
        if (msg.attempt >= this.maxRetries) {
          this.emitter.emit(`${topic}:dlq`, msg.payload, err);
          msg.resolve();
          return;
        }
        const retry: Message<T> = {
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
  onDeadLetter<T>(topic: string, handler: (payload: T, error: unknown) => void): void {
    this.emitter.on(`${topic}:dlq`, handler);
  }
}

export default Broker;
