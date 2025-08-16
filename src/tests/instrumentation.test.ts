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
    delete process.env.MONGODB_URI;
    delete process.env.MODULE_ORCHESTRATOR_DISABLED;
  });

  afterEach(() => {
    (orchestrator as any).startModuleOrchestrator = origStart;
    delete process.env.NEXT_RUNTIME;
    delete process.env.MONGODB_URI;
    delete process.env.MODULE_ORCHESTRATOR_DISABLED;
  });

  it('starts orchestrator when running in node runtime and MONGODB_URI present', async () => {
    process.env.NEXT_RUNTIME = 'nodejs';
    process.env.MONGODB_URI = 'mongodb://localhost/test';
    await register();
    assert.ok(started);
  });

  it('does not start orchestrator when MONGODB_URI is missing', async () => {
    process.env.NEXT_RUNTIME = 'nodejs';
    await register();
    assert.equal(started, false);
  });

  it('does not start orchestrator in edge runtime', async () => {
    process.env.NEXT_RUNTIME = 'edge';
    process.env.MONGODB_URI = 'mongodb://localhost/test';
    await register();
    assert.equal(started, false);
  });

  it('skips orchestrator when MODULE_ORCHESTRATOR_DISABLED is true', async () => {
    process.env.NEXT_RUNTIME = 'nodejs';
    process.env.MONGODB_URI = 'mongodb://localhost/test';
    process.env.MODULE_ORCHESTRATOR_DISABLED = 'true';
    await register();
    assert.equal(started, false);
  });
});
