import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import * as orchestrator from '../services/moduleOrchestrator';
import { register } from '../../instrumentation';

const origStart = orchestrator.startModuleOrchestrator;
const origStop = orchestrator.stopModuleOrchestrator;

let started: boolean;
let stopped: boolean;

describe('instrumentation', () => {
  beforeEach(() => {
    started = false;
    stopped = false;
    (orchestrator as any).startModuleOrchestrator = () => {
      started = true;
    };
    (orchestrator as any).stopModuleOrchestrator = () => {
      stopped = true;
    };
    process.removeAllListeners('SIGINT');
    process.removeAllListeners('SIGTERM');
    process.removeAllListeners('exit');
  });

  afterEach(() => {
    (orchestrator as any).startModuleOrchestrator = origStart;
    (orchestrator as any).stopModuleOrchestrator = origStop;
    process.removeAllListeners('SIGINT');
    process.removeAllListeners('SIGTERM');
    process.removeAllListeners('exit');
    delete process.env.NEXT_RUNTIME;
  });

  it('starts orchestrator and registers shutdown hooks', () => {
    process.env.NEXT_RUNTIME = 'nodejs';
    register();
    assert.ok(started);
    process.emit('SIGTERM');
    assert.ok(stopped);
  });
});

