import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  checkModules,
  startModuleOrchestrator,
  stopModuleOrchestrator,
  getOrchestratorMetrics,
} from '../moduleOrchestrator';
import Module from '../../models/Module';
import * as eventBus from '../../messaging/eventBus';
import logger from '../../lib/logger';
import { GET as metricsRoute } from '../../app/api/orchestrator/metrics/route';

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
  (global as any).fetch = originalFetch as any;
  stopModuleOrchestrator();
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
    (global as any).fetch = async () => ({ ok: true }) as any;

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
    (global as any).fetch = async (url: string) =>
      ({ ok: !url.includes('m1') }) as any;

    await checkModules(1);

    assert.deepEqual(deleted, ['1']);
    assert.deepEqual(updated, ['2']);
  });

  it('logs module id when ping fails', async () => {
    const modules = [
      { _id: '1', endpoints: { rest: 'http://m1' }, lastHandshake: new Date() },
    ];
    (Module as any).find = createFindStub(modules);
    (Module as any).findByIdAndUpdate = async () => {};
    const error = new Error('fail');
    (global as any).fetch = async () => {
      throw error;
    };
    const logs: any[] = [];
    const originalError = logger.error;
    logger.error = (...args: unknown[]) => {
      logs.push(args);
    };

    await checkModules();

    logger.error = originalError;
    assert.ok(
      logs.some(
        (args) => args[0] === 'Ping failed' && args[1] === '1' && args[2] === error
      )
    );
  });

  it('sends Authorization header with integrationToken when pinging', async () => {
    const token = 'tok123';
    const modules = [
      {
        _id: '1',
        endpoints: { rest: 'http://m1' },
        lastHandshake: new Date(),
        status: 'offline',
        integrationToken: token,
      },
    ];
    (Module as any).find = createFindStub(modules);
    (Module as any).findByIdAndUpdate = async () => {};
    let headers: any;
    (global as any).fetch = async (_url: string, opts: any) => {
      headers = opts?.headers;
      return { ok: true } as any;
    };

    await checkModules();

    assert.equal(headers?.Authorization, `Bearer ${token}`);
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
    (global as any).fetch = async () => ({ ok: true }) as any;
    const events: Array<{ event: string; payload: any }> = [];
    (eventBus as any).publish = async (event: string, payload: any) => {
      events.push({ event, payload });
    };

    await checkModules();

    const filtered = events.filter((e) => e.event !== 'orchestrator.cycle');
    assert.deepEqual(updated, [{ id: '1', status: 'online' }]);
    assert.deepEqual(filtered, [
      { event: 'module.online', payload: { moduleId: '1' } },
    ]);
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
    (global as any).fetch = async () => ({ ok: false }) as any;
    const events: Array<{ event: string; payload: any }> = [];
    (eventBus as any).publish = async (event: string, payload: any) => {
      events.push({ event, payload });
    };

    await checkModules(1);

    const filtered = events.filter((e) => e.event !== 'orchestrator.cycle');
    assert.deepEqual(deleted, ['1']);
    assert.deepEqual(filtered, [
      { event: 'module.removed', payload: { moduleId: '1' } },
    ]);
  });

  it('emits orchestrator.cycle with metrics', async () => {
    const modules = [
      { _id: '1', endpoints: { rest: 'http://m1' }, lastHandshake: new Date() },
      { _id: '2', endpoints: { rest: 'http://m2' }, lastHandshake: new Date() },
    ];
    (Module as any).find = createFindStub(modules);
    (Module as any).findByIdAndUpdate = async () => {};
    (global as any).fetch = async (url: string) => ({ ok: !url.includes('m2') }) as any;
    const events: Array<{ event: string; payload: any }> = [];
    (eventBus as any).publish = async (event: string, payload: any) => {
      events.push({ event, payload });
    };

    await checkModules();

    const metric = events.find((e) => e.event === 'orchestrator.cycle');
    assert.ok(metric);
    assert.equal(metric?.payload.online, 1);
    assert.equal(metric?.payload.offline, 1);
    assert.ok(typeof metric?.payload.durationMs === 'number');
  });

  it('prunes modules without lastHandshake on the next cycle', async () => {
    const modules = [
      {
        _id: '1',
        endpoints: { rest: 'http://m1' },
        status: 'online',
        lastHandshake: undefined as any,
      },
    ];
    (Module as any).find = createFindStub(modules);
    (Module as any).findByIdAndUpdate = async (id: string, update: any) => {
      const mod = modules.find((m) => String(m._id) === String(id));
      if (mod) Object.assign(mod, update);
    };
    const deleted: string[] = [];
    (Module as any).deleteOne = async (query: any) => {
      deleted.push(String(query._id));
    };
    (global as any).fetch = async () => ({ ok: false }) as any;

    await checkModules(1);
    assert.ok(modules[0].lastHandshake instanceof Date);
    assert.deepEqual(deleted, []);

    await new Promise((r) => setTimeout(r, 2));
    await checkModules(1);

    assert.deepEqual(deleted, ['1']);
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
    (global as any).fetch = async () => {
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
    (global as any).fetch = async () => ({ ok: true }) as any;

    await checkModules();

    assert.ok(findCalls >= 2);
    assert.ok(updated.length >= 100);
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
    (global as any).fetch = async () => ({ ok: true }) as any;

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
    (global as any).fetch = async (_: string, init: any) =>
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

  it('uses custom pingPath when provided', async () => {
    const modules = [
      { _id: '1', endpoints: { rest: 'http://m1' }, lastHandshake: new Date() },
    ];
    (Module as any).find = createFindStub(modules);
    (Module as any).findByIdAndUpdate = async () => {};
    let url: string | undefined;
    (global as any).fetch = async (u: string) => {
      url = u;
      return { ok: true } as any;
    };

    await checkModules(undefined, undefined, undefined, undefined, 'status');

    assert.equal(url, 'http://m1/status');
  });

  it('passes pingTimeoutMs from startModuleOrchestrator to checkModules', async () => {
    const modules = [
      { _id: '1', endpoints: { rest: 'http://m1' }, lastHandshake: new Date() },
    ];
    (Module as any).find = createFindStub(modules);
    (Module as any).findByIdAndUpdate = async () => {};
    const durations: number[] = [];
    (global as any).fetch = async (_: string, init: any) =>
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

  it('passes pingPath from startModuleOrchestrator to checkModules', async () => {
    const modules = [
      { _id: '1', endpoints: { rest: 'http://m1' }, lastHandshake: new Date() },
    ];
    (Module as any).find = createFindStub(modules);
    (Module as any).findByIdAndUpdate = async () => {};
    let url: string | undefined;
    (global as any).fetch = async (u: string) => {
      url = u;
      return { ok: true } as any;
    };

    startModuleOrchestrator({ intervalMs: 1_000, pingPath: 'health' });
    await new Promise((r) => setTimeout(r, 50));
    stopModuleOrchestrator();

    assert.equal(url, 'http://m1/health');
  });

  it('passes batchSize from startModuleOrchestrator to checkModules', async () => {
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
    (Module as any).findByIdAndUpdate = async () => {};
    (global as any).fetch = async () => ({ ok: true }) as any;

    startModuleOrchestrator({ intervalMs: 1_000, batchSize: 50 });
    await new Promise((r) => setTimeout(r, 50));
    stopModuleOrchestrator();

    assert.ok(findCalls >= 2);
  });

  it('passes pruneOfflineMs from startModuleOrchestrator to checkModules', async () => {
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
    (global as any).fetch = async () => ({ ok: false }) as any;
    const events: Array<{ event: string; payload: any }> = [];
    (eventBus as any).publish = async (event: string, payload: any) => {
      events.push({ event, payload });
    };

    startModuleOrchestrator({ intervalMs: 1_000, pruneOfflineMs: 1 });
    await new Promise((r) => setTimeout(r, 50));
    stopModuleOrchestrator();

    const filtered = events.filter((e) => e.event !== 'orchestrator.cycle');
    assert.deepEqual(deleted, ['1']);
    assert.deepEqual(filtered, [
      { event: 'module.removed', payload: { moduleId: '1' } },
    ]);
  });

  it('passes maxConcurrentPings from startModuleOrchestrator to checkModules', async () => {
    const modules = Array.from({ length: 20 }, (_, i) => ({
      _id: String(i),
      endpoints: { rest: `http://m${i}` },
      lastHandshake: new Date(),
    }));
    (Module as any).find = createFindStub(modules);
    (Module as any).findByIdAndUpdate = async () => {};
    let active = 0;
    let maxActive = 0;
    (global as any).fetch = async () => {
      active++;
      maxActive = Math.max(maxActive, active);
      await new Promise((r) => setTimeout(r, 5));
      active--;
      return { ok: true } as any;
    };

    startModuleOrchestrator({ intervalMs: 1_000, maxConcurrentPings: 5 });
    await new Promise((r) => setTimeout(r, 200));
    stopModuleOrchestrator();

    assert.ok(maxActive <= 5);
  });

  it('throws if maxConcurrentPings is not positive in checkModules', async () => {
    await assert.rejects(() => checkModules(undefined, undefined, 0), {
      message: 'maxConcurrentPings must be a positive number',
    });
  });

  it('throws if pruneOfflineMs is not positive in checkModules', async () => {
    await assert.rejects(() => checkModules(0), {
      message: 'pruneOfflineMs must be a positive number',
    });
  });

  it('throws if pingTimeoutMs is not positive in checkModules', async () => {
    await assert.rejects(() => checkModules(undefined, 0), {
      message: 'pingTimeoutMs must be a positive number',
    });
  });

  it('throws if batchSize is not positive in checkModules', async () => {
    await assert.rejects(() => checkModules(undefined, undefined, undefined, 0), {
      message: 'batchSize must be a positive number',
    });
  });

  it('throws if pingPath is empty in checkModules', async () => {
    await assert.rejects(
      () => checkModules(undefined, undefined, undefined, undefined, ''),
      { message: 'pingPath must be a non-empty string' }
    );
  });

  it('throws if intervalMs is not positive in startModuleOrchestrator', () => {
    assert.throws(() => startModuleOrchestrator({ intervalMs: 0 }), {
      message: 'intervalMs must be a positive number',
    });
  });

  it('throws if maxConcurrentPings is not positive in startModuleOrchestrator', () => {
    assert.throws(
      () => startModuleOrchestrator({ intervalMs: 1_000, maxConcurrentPings: 0 }),
      { message: 'maxConcurrentPings must be a positive number' }
    );
  });

  it('throws if pruneOfflineMs is not positive in startModuleOrchestrator', () => {
    assert.throws(
      () => startModuleOrchestrator({ intervalMs: 1_000, pruneOfflineMs: 0 }),
      { message: 'pruneOfflineMs must be a positive number' }
    );
  });

  it('throws if pingTimeoutMs is not positive in startModuleOrchestrator', () => {
    assert.throws(
      () => startModuleOrchestrator({ intervalMs: 1_000, pingTimeoutMs: 0 }),
      { message: 'pingTimeoutMs must be a positive number' }
    );
  });

  it('throws if batchSize is not positive in startModuleOrchestrator', () => {
    assert.throws(
      () => startModuleOrchestrator({ intervalMs: 1_000, batchSize: 0 }),
      { message: 'batchSize must be a positive number' }
    );
  });

  it('throws if pingPath is empty in startModuleOrchestrator', () => {
    assert.throws(
      () => startModuleOrchestrator({ intervalMs: 1_000, pingPath: '' }),
      { message: 'pingPath must be a non-empty string' }
    );
  });

  it('exposes last cycle metrics via getOrchestratorMetrics', async () => {
    const modules = [
      { _id: '1', endpoints: { rest: 'http://m1' }, lastHandshake: new Date() },
      { _id: '2', endpoints: { rest: 'http://m2' }, lastHandshake: new Date() },
    ];
    (Module as any).find = createFindStub(modules);
    (Module as any).findByIdAndUpdate = async () => {};
    // m1 online, m2 offline
    (global as any).fetch = async (url: any) => ({ ok: String(url).includes('m1') }) as any;

    await checkModules();

    const m = getOrchestratorMetrics();
    assert.ok(m, 'metrics should be set');
    assert.equal(m?.online, 1);
    assert.equal(m?.offline, 1);
    assert.ok(typeof m?.durationMs === 'number');
    assert.ok(typeof m?.timestamp === 'string');
  });

  it('reports isRunning=false via metrics endpoint when idle', async () => {
    const modules = [
      { _id: '1', endpoints: { rest: 'http://m1' }, lastHandshake: new Date() },
    ];
    (Module as any).find = createFindStub(modules);
    (Module as any).findByIdAndUpdate = async () => {};
    (global as any).fetch = async () => ({ ok: true }) as any;

    startModuleOrchestrator({ intervalMs: 1_000 });
    await new Promise((r) => setTimeout(r, 100));

    const res = await metricsRoute();
    const body = await res.json();
    assert.equal(body.status, 'ok');
    assert.equal(body.metrics.isRunning, false);
    assert.equal(body.metrics.isActive, true);
    stopModuleOrchestrator();
  });
});
