import { describe, it, TestContext } from 'node:test';
import assert from 'node:assert/strict';
import * as rabbitmq from '../../lib/rabbitmq';
import { publish, subscribe } from '../eventBus';

describe('eventBus', () => {
  it('delivers published events to subscribers', async (t: TestContext) => {
    const handlers = new Map<string, (payload: any) => Promise<void>>();
    t.mock.method(rabbitmq, 'subscribe', async (
      queue: string,
      exchange: string,
      routingKey: string,
      onMessage: (payload: any) => Promise<void>,
    ) => {
      handlers.set(routingKey, onMessage);
    });
    t.mock.method(rabbitmq, 'publish', async (
      exchange: string,
      routingKey: string,
      payload: any,
    ) => {
      const handler = handlers.get(routingKey);
      if (handler) await handler(payload);
    });

    const payload = { foo: 'bar' };
    let received: any;

    await subscribe('test.event', (data) => {
      received = data;
    });

    await publish('test.event', payload);
    assert.deepEqual(received, payload);
  });

  it('resolves publish promise after async handlers', async (t: TestContext) => {
    const handlers = new Map<string, (payload: any) => Promise<void>>();
    t.mock.timers.enable();
    t.mock.method(rabbitmq, 'subscribe', async (
      queue: string,
      exchange: string,
      routingKey: string,
      onMessage: (payload: any) => Promise<void>,
    ) => {
      handlers.set(routingKey, onMessage);
    });
    t.mock.method(rabbitmq, 'publish', async (
      exchange: string,
      routingKey: string,
      payload: any,
    ) => {
      const handler = handlers.get(routingKey);
      if (handler) await handler(payload);
    });

    let handled = false;
    await subscribe('async.event', async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      handled = true;
    });

    const publishPromise = publish('async.event', {});
    t.mock.timers.tick(10);
    await publishPromise;
    assert.equal(handled, true);
  });
});
