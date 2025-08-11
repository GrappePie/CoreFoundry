import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { checkModules } from '../moduleOrchestrator';
import Module from '../../models/Module';
import * as eventBus from '../../messaging/eventBus';

let originalFetch: typeof fetch;

beforeEach(() => {
  originalFetch = global.fetch;
  (eventBus as any).publish = async () => {};
});

afterEach(() => {
  global.fetch = originalFetch;
});

describe('moduleOrchestrator service', () => {
  it('continues when findByIdAndUpdate fails', async () => {
    const modules = [
      { _id: '1', endpoints: { rest: 'http://m1' }, lastHandshake: new Date() },
      { _id: '2', endpoints: { rest: 'http://m2' }, lastHandshake: new Date() },
    ];
    (Module as any).find = async () => modules;
    const updated: string[] = [];
    (Module as any).findByIdAndUpdate = async (id: string) => {
      updated.push(String(id));
      if (String(id) === '1') throw new Error('fail');
    };
    global.fetch = async () => ({ ok: true }) as any;

    await checkModules();

    assert.deepEqual(updated, ['1', '2']);
  });

  it('continues when deleteOne fails', async () => {
    const modules = [
      { _id: '1', endpoints: { rest: 'http://m1' }, lastHandshake: new Date(0) },
      { _id: '2', endpoints: { rest: 'http://m2' }, lastHandshake: new Date() },
    ];
    (Module as any).find = async () => modules;
    const updated: string[] = [];
    (Module as any).findByIdAndUpdate = async (id: string) => {
      updated.push(String(id));
    };
    const deleted: string[] = [];
    (Module as any).deleteOne = async (query: any) => {
      deleted.push(String(query._id));
      throw new Error('delete fail');
    };
    global.fetch = async (url: string) =>
      ({ ok: !url.includes('m1') }) as any;

    await checkModules(1);

    assert.deepEqual(deleted, ['1']);
    assert.deepEqual(updated, ['2']);
  });

  it('publishes module.online when an offline module responds', async () => {
    const modules = [
      {
        _id: '1',
        endpoints: { rest: 'http://m1' },
        lastHandshake: new Date(0),
        status: 'offline',
      },
    ];
    (Module as any).find = async () => modules;
    const updated: Array<{ id: string; status: string }> = [];
    (Module as any).findByIdAndUpdate = async (id: string, update: any) => {
      updated.push({ id: String(id), status: update.status });
    };
    global.fetch = async () => ({ ok: true }) as any;
    const events: Array<{ event: string; payload: any }> = [];
    (eventBus as any).publish = async (event: string, payload: any) => {
      events.push({ event, payload });
    };

    await checkModules();

    assert.deepEqual(updated, [{ id: '1', status: 'online' }]);
    assert.deepEqual(events, [{ event: 'module.online', payload: { moduleId: '1' } }]);
  });

  it('removes modules exceeding pruneOfflineMs and emits module.removed', async () => {
    const modules = [
      {
        _id: '1',
        endpoints: { rest: 'http://m1' },
        lastHandshake: new Date(0),
      },
    ];
    (Module as any).find = async () => modules;
    (Module as any).findByIdAndUpdate = async () => {
      throw new Error('should not update');
    };
    const deleted: string[] = [];
    (Module as any).deleteOne = async (query: any) => {
      deleted.push(String(query._id));
    };
    global.fetch = async () => ({ ok: false }) as any;
    const events: Array<{ event: string; payload: any }> = [];
    (eventBus as any).publish = async (event: string, payload: any) => {
      events.push({ event, payload });
    };

    await checkModules(1);

    assert.deepEqual(deleted, ['1']);
    assert.deepEqual(events, [{ event: 'module.removed', payload: { moduleId: '1' } }]);
  });

  it('respects maxConcurrentPings limit', async () => {
    const modules = Array.from({ length: 20 }, (_, i) => ({
      _id: String(i),
      endpoints: { rest: `http://m${i}` },
      lastHandshake: new Date(),
    }));
    (Module as any).find = async () => modules;
    (Module as any).findByIdAndUpdate = async () => {};
    let active = 0;
    let maxActive = 0;
    global.fetch = async () => {
      active++;
      maxActive = Math.max(maxActive, active);
      await new Promise((r) => setTimeout(r, 5));
      active--;
      return { ok: true } as any;
    };

    await checkModules(undefined, undefined, 5);

    assert.ok(maxActive <= 5);
  });
});
