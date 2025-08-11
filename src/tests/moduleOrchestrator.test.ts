import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { checkModules } from '../services/moduleOrchestrator';
import Module from '../models/Module';
import * as eventBus from '../messaging/eventBus';

const emitted: Array<{ event: string; moduleId: string }> = [];
(eventBus as any).publish = async (
  event: string,
  payload: { moduleId: string }
) => {
  emitted.push({ event, moduleId: payload.moduleId });
};

let modules: any[] = [];

(Module as any).find = async () => modules;
(Module as any).findByIdAndUpdate = async (id: any, update: any) => {
  const mod = modules.find((m) => m._id === id);
  Object.assign(mod, update);
  return mod;
};
(Module as any).deleteOne = async ({ _id }: any) => {
  const index = modules.findIndex((m) => m._id === _id);
  if (index !== -1) modules.splice(index, 1);
};

(global as any).fetch = (url: string, { signal }: any = {}) => {
  if (String(url).includes('m1')) {
    return Promise.resolve({ ok: true } as any);
  }
  if (String(url).includes('m2')) {
    return Promise.resolve({ ok: false } as any);
  }
  if (String(url).includes('m3')) {
    return new Promise((_res, rej) => {
      signal?.addEventListener('abort', () => {
        const err = new Error('Aborted');
        (err as any).name = 'AbortError';
        rej(err);
      });
    });
  }
  return Promise.resolve({ ok: false } as any);
};

describe('moduleOrchestrator service', () => {
  it('updates module status, prunes offline modules and emits events', async () => {
    modules = [
      {
        _id: '1',
        endpoints: { rest: 'https://m1.local/api' },
        status: 'offline',
      },
      {
        _id: '2',
        endpoints: { rest: 'https://m2.local/api' },
        status: 'offline',
        lastHandshake: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
      },
      {
        _id: '3',
        endpoints: { rest: 'https://m3.local/api' },
        status: 'offline',
      },
    ];
    emitted.length = 0;

    await checkModules(30 * 24 * 60 * 60 * 1000, 50);
    assert.equal(modules.length, 2);
    const m1 = modules.find((m) => m._id === '1');
    const m3 = modules.find((m) => m._id === '3');
    assert(m1);
    assert(m3);
    assert.equal(m1.status, 'online');
    assert(m1.lastHandshake instanceof Date);
    assert.equal(m3.status, 'offline');

    assert.deepEqual(emitted, [
      { event: 'module.online', moduleId: '1' },
      { event: 'module.removed', moduleId: '2' },
      { event: 'module.offline', moduleId: '3' },
    ]);
  });

  it('emits module.offline when ping URL is invalid', async () => {
    modules = [
      {
        _id: '4',
        endpoints: { rest: 'invalid-url' },
        status: 'online',
      },
    ];
    emitted.length = 0;

    await checkModules(undefined, 50);
    const m4 = modules.find((m) => m._id === '4');
    assert(m4);
    assert.equal(m4.status, 'offline');
    assert.deepEqual(emitted, [{ event: 'module.offline', moduleId: '4' }]);
  });
});
