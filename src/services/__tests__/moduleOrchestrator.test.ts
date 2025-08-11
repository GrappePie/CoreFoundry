import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  checkModules,
  startModuleOrchestrator,
  stopModuleOrchestrator,
} from '../moduleOrchestrator';
import Module from '../../models/Module';
import * as eventBus from '../../messaging/eventBus';

let originalFetch: typeof fetch;

function createFindStub(
  modules: any[],
  opts: { onCall?: () => void; onSort?: (s: any) => void } = {}
) {
  return (query: any = {}) => {
    opts.onCall?.();
    return {
      sort: (s: any) => {
        opts.onSort?.(s);
        return {
          limit: (l: number) => {
            const filtered = modules
              .filter(
                (m) => !query._id || Number(m._id) > Number(query._id.$gt)
              )
              .sort((a, b) => String(a._id).localeCompare(String(b._id)))
              .slice(0, l);
            return Promise.resolve(filtered);
          },
        };
      },
    };
  };
}

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
    (Module as any).find = createFindStub(modules);
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
    (Module as any).find = createFindStub(modules);
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
    (Module as any).find = createFindStub(modules);
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
    (Module as any).find = createFindStub(modules);
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
    (Module as any).find = createFindStub(modules);
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

  it('iterates over multiple batches', async () => {
    const modules = Array.from({ length: 120 }, (_, i) => ({
      _id: String(i),
      endpoints: { rest: `http://m${i}` },
      lastHandshake: new Date(),
    }));
    let findCalls = 0;
    (Module as any).find = createFindStub(modules, {
      onCall: () => {
        findCalls++;
      },
    });
    const updated: string[] = [];
    (Module as any).findByIdAndUpdate = async (id: string) => {
      updated.push(String(id));
    };
    global.fetch = async () => ({ ok: true }) as any;

    await checkModules();

    assert.equal(findCalls, 3);
    assert.equal(updated.length, modules.length);
  });

  it('sorts modules by _id for stable pagination', async () => {
    const modules = [
      { _id: 'b', endpoints: { rest: 'http://m2' }, lastHandshake: new Date() },
      { _id: 'a', endpoints: { rest: 'http://m1' }, lastHandshake: new Date() },
      { _id: 'c', endpoints: { rest: 'http://m3' }, lastHandshake: new Date() },
    ];
    let sortOptions: any = null;
    (Module as any).find = createFindStub(modules, {
      onSort: (s) => {
        sortOptions = s;
      },
    });
    const processed: string[] = [];
    (Module as any).findByIdAndUpdate = async (id: string) => {
      processed.push(String(id));
    };
    global.fetch = async () => ({ ok: true }) as any;

    await checkModules();

    assert.deepEqual(sortOptions, { _id: 1 });
    assert.deepEqual(processed, ['a', 'b', 'c']);
  });

  it('aborts ping after pingTimeoutMs', async () => {
    const modules = [
      { _id: '1', endpoints: { rest: 'http://m1' }, lastHandshake: new Date() },
    ];
    (Module as any).find = createFindStub(modules);
    (Module as any).findByIdAndUpdate = async () => {};
    const durations: number[] = [];
    global.fetch = async (_: string, init: any) =>
      new Promise((resolve) => {
        const start = Date.now();
        init.signal.addEventListener('abort', () => {
          durations.push(Date.now() - start);
          resolve({ ok: false } as any);
        });
      });

    await checkModules(undefined, 10);

    assert.ok(durations[0] >= 10);
    assert.ok(durations[0] < 50);
  });

  it('passes pingTimeoutMs from startModuleOrchestrator to checkModules', async () => {
    const modules = [
      { _id: '1', endpoints: { rest: 'http://m1' }, lastHandshake: new Date() },
    ];
    (Module as any).find = createFindStub(modules);
    (Module as any).findByIdAndUpdate = async () => {};
    const durations: number[] = [];
    global.fetch = async (_: string, init: any) =>
      new Promise((resolve) => {
        const start = Date.now();
        init.signal.addEventListener('abort', () => {
          durations.push(Date.now() - start);
          resolve({ ok: false } as any);
        });
      });

    startModuleOrchestrator({ intervalMs: 1_000, pingTimeoutMs: 10 });
    await new Promise((r) => setTimeout(r, 50));
    stopModuleOrchestrator();

    assert.ok(durations[0] >= 10);
    assert.ok(durations[0] < 50);
  });
});
