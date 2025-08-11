import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import Module from '../models/Module';
import { startModuleOrchestrator, stopModuleOrchestrator } from '../services/moduleOrchestrator';

const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));

beforeEach(async () => {
  stopModuleOrchestrator();
  await wait(50);
});

describe('module orchestrator cycle control', () => {
  it('runs without overlapping cycles', async () => {
    let running = 0;
    let maxRunning = 0;
    let calls = 0;
    (Module as any).find = async () => {
      running++;
      maxRunning = Math.max(maxRunning, running);
      await wait(80);
      running--;
      calls++;
      return [];
    };

    startModuleOrchestrator({ intervalMs: 10 });
    await wait(200);
    stopModuleOrchestrator();
    await wait(100);

    assert.equal(maxRunning, 1);
    assert.ok(calls >= 2);
  });

  it('recovers and schedules new cycle after errors', async () => {
    let calls = 0;
    (Module as any).find = async () => {
      calls++;
      if (calls === 1) throw new Error('fail');
      return [];
    };

    startModuleOrchestrator({ intervalMs: 10 });
    await wait(120);
    stopModuleOrchestrator();
    await wait(50);

    assert.ok(calls >= 2);
  });
});
