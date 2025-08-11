import { describe, it, TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { publish, subscribe } from '../eventBus';

describe('eventBus', () => {
  it('delivers published events to subscribers', async () => {
    const payload = { foo: 'bar' };
    let received: any;

    subscribe('test.event', (data) => {
      received = data;
    });

    await publish('test.event', payload);
    assert.deepEqual(received, payload);
  });

  it('resolves publish promise after async handlers', async (t: TestContext) => {
    let handled = false;
    t.mock.timers.enable();

    subscribe('async.event', async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      handled = true;
    });

    const publishPromise = publish('async.event', {});
    t.mock.timers.tick(10);
    await publishPromise;
    assert.equal(handled, true);
  });
});
