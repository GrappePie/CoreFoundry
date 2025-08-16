import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import * as orchestrator from '../services/moduleOrchestrator';
import { register } from '../../instrumentation';

const origStart = orchestrator.startModuleOrchestrator;

let started: boolean;

describe('instrumentation', () => {
  beforeEach(() => {
    started = false;
    (orchestrator as any).startModuleOrchestrator = () => {
      started = true;
    };
    delete process.env.NEXT_RUNTIME;
  });

  afterEach(() => {
    (orchestrator as any).startModuleOrchestrator = origStart;
    delete process.env.NEXT_RUNTIME;
  });

  it('starts orchestrator when running in node runtime', async () => {
    process.env.NEXT_RUNTIME = 'nodejs';
    await register();
    assert.ok(started);
  });

  it('does not start orchestrator in edge runtime', async () => {
    process.env.NEXT_RUNTIME = 'edge';
    await register();
    assert.equal(started, false);
  });
});
