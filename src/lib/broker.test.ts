import { describe, it, TestContext } from 'node:test';
import assert from 'node:assert/strict';
import Broker from './broker';

// Tests for Broker behaviors

describe('Broker', () => {
  it('delivers messages to subscribers', async () => {
    const broker = new Broker();
    const payload = { value: 42 };
    let received: any;

    broker.subscribe('topic', (msg) => {
      received = msg;
    });

    await broker.publish('topic', payload);
    assert.deepEqual(received, payload);
  });

  it('resolves publish promise when async handler acknowledges', async (t: TestContext) => {
    const broker = new Broker();
    let handled = false;

    t.mock.timers.enable();

    broker.subscribe('async', async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      handled = true;
    });

    const publishPromise = broker.publish('async', 'data');
    t.mock.timers.tick(10);
    await publishPromise;
    assert.equal(handled, true);
  });

  it('retries handler on failure up to maxRetries', async (t: TestContext) => {
    const broker = new Broker({ maxRetries: 2, retryDelayMs: 100 });
    let attempts = 0;

    t.mock.timers.enable();

    broker.subscribe('retry', () => {
      attempts += 1;
      if (attempts <= 2) {
        throw new Error('fail');
      }
    });

    const publishPromise = broker.publish('retry', 'payload');
    assert.equal(attempts, 1);

    t.mock.timers.tick(100); // first retry
    assert.equal(attempts, 2);

    t.mock.timers.tick(100); // second retry, should succeed
    await publishPromise;
    assert.equal(attempts, 3);
  });

  it('sends message to DLQ after exceeding retries', async (t: TestContext) => {
    const broker = new Broker({ maxRetries: 1, retryDelayMs: 100 });
    let dlqPayload: any;
    let dlqError: unknown;
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

    assert.equal(attempts, 2); // initial + 1 retry
    assert.equal(dlqPayload, 'task');
    assert(dlqError instanceof Error);
  });
});

