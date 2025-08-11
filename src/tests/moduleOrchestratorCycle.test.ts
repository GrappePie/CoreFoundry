import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import Module from '../models/Module';
import {
  checkModules,
  startModuleOrchestrator,
  stopModuleOrchestrator,
} from '../services/moduleOrchestrator';
import * as eventBus from '../messaging/eventBus';

const emitted: Array<{ event: string; moduleId: string }> = [];
(eventBus as any).publish = async (
  event: string,
  payload: { moduleId: string }
) => {
  emitted.push({ event, moduleId: payload.moduleId });
};

const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));

function createFindStub(
  modules: any[],
  opts: { onCall?: () => void } = {}
) {
  return (query: any = {}) => {
    opts.onCall?.();
    return {
      sort: () => ({
        limit: (l: number) => {
          const filtered = modules
            .filter(
              (m) => !query._id || Number(m._id) > Number(query._id.$gt)
            )
            .sort((a, b) => String(a._id).localeCompare(String(b._id)))
            .slice(0, l);
          return Promise.resolve(filtered);
        },
      }),
    };
  };
}

beforeEach(async () => {
  stopModuleOrchestrator();
  await wait(50);
  emitted.length = 0;
});

describe('module orchestrator cycle control', () => {
  it('runs without overlapping cycles', async () => {
    let running = 0;
    let maxRunning = 0;
    let calls = 0;
    (Module as any).find = () => ({
      sort: () => ({
        limit: async () => {
          running++;
          maxRunning = Math.max(maxRunning, running);
          await wait(80);
          running--;
          calls++;
          return [];
        },
      }),
    });

    startModuleOrchestrator({ intervalMs: 10 });
    await wait(5);
    assert.equal(running, 1);
    await wait(195);
    stopModuleOrchestrator();
    await wait(100);

    assert.equal(maxRunning, 1);
    assert.ok(calls >= 3);
  });

  it('recovers and schedules new cycle after errors', async () => {
    let calls = 0;
    (Module as any).find = () => ({
      sort: () => ({
        limit: async () => {
          calls++;
          if (calls === 1) throw new Error('fail');
          return [];
        },
      }),
    });

    startModuleOrchestrator({ intervalMs: 10 });
    await wait(1);
    assert.equal(calls, 1);
    await wait(120);
    stopModuleOrchestrator();
    await wait(50);

    assert.ok(calls >= 2);
  });

  it('stops scheduling when stopped mid-cycle', async () => {
    let calls = 0;
    (Module as any).find = () => ({
      sort: () => ({
        limit: async () => {
          calls++;
          await wait(50);
          return [];
        },
      }),
    });

    startModuleOrchestrator({ intervalMs: 10 });
    await wait(5);
    stopModuleOrchestrator();
    await wait(100);

    assert.equal(calls, 1);
  });

  it('emits module.online only when status changes', async () => {
    const originalFind = Module.find;
    const originalFindByIdAndUpdate = (Module as any).findByIdAndUpdate;
    const originalFetch = global.fetch;
    try {
      const modules = [
        {
          _id: '1',
          endpoints: { rest: 'https://m1.local/api' },
          status: 'offline',
        },
      ];
      (Module as any).find = createFindStub(modules);
      (Module as any).findByIdAndUpdate = async (id: any, update: any) => {
        const mod = modules.find((m) => m._id === id);
        Object.assign(mod!, update);
        return mod;
      };
      (global as any).fetch = async () => ({ ok: true } as any);

      await checkModules(undefined, 50);
      assert.deepEqual(emitted, [{ event: 'module.online', moduleId: '1' }]);

      emitted.length = 0;
      await checkModules(undefined, 50);
      assert.deepEqual(emitted, []);
    } finally {
      (Module as any).find = originalFind;
      (Module as any).findByIdAndUpdate = originalFindByIdAndUpdate;
      global.fetch = originalFetch;
    }
  });

  it('emits module.offline only when status changes', async () => {
    const originalFind = Module.find;
    const originalFindByIdAndUpdate = (Module as any).findByIdAndUpdate;
    const originalFetch = global.fetch;
    try {
      const modules = [
        {
          _id: '1',
          endpoints: { rest: 'https://m1.local/api' },
          status: 'online',
        },
      ];
      (Module as any).find = createFindStub(modules);
      (Module as any).findByIdAndUpdate = async (id: any, update: any) => {
        const mod = modules.find((m) => m._id === id);
        Object.assign(mod!, update);
        return mod;
      };
      (global as any).fetch = async () => ({ ok: false } as any);

      await checkModules(undefined, 50);
      assert.deepEqual(emitted, [{ event: 'module.offline', moduleId: '1' }]);

      emitted.length = 0;
      await checkModules(undefined, 50);
      assert.deepEqual(emitted, []);
    } finally {
      (Module as any).find = originalFind;
      (Module as any).findByIdAndUpdate = originalFindByIdAndUpdate;
      global.fetch = originalFetch;
    }
  });
});
