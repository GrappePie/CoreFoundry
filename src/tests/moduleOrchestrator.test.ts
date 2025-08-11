import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { checkModules } from '../services/moduleOrchestrator';
import Module from '../models/Module';

const modules: any[] = [
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
];

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

(global as any).fetch = async (url: string) => {
  if (String(url).includes('m1')) {
    return { ok: true } as any;
  }
  return { ok: false } as any;
};

describe('moduleOrchestrator service', () => {
  it('updates module status and prunes long-term offline modules', async () => {
    await checkModules(30 * 24 * 60 * 60 * 1000);
    assert.equal(modules.length, 1);
    assert.equal(modules[0]._id, '1');
    assert.equal(modules[0].status, 'online');
    assert(modules[0].lastHandshake instanceof Date);
  });
});
