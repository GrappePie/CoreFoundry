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
