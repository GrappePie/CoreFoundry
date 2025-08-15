import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import Module from '../../models/Module';
import { verifyModulePermissions } from '../auth';

process.env.MONGODB_URI = 'mongodb://localhost/test';
mock.method(mongoose, 'connect', async () => mongoose as any);

function makeRequest(headers: Record<string, string> = {}) {
  const store: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) {
    store[k.toLowerCase()] = v;
  }
  return {
    headers: {
      get: (key: string) => store[key.toLowerCase()] ?? null,
    },
  } as any;
}

describe('verifyModulePermissions', () => {
  it('returns 401 when X-Module-Id is missing', async () => {
    const res = await verifyModulePermissions(makeRequest());
    assert.equal(res.status, 401);
  });

  it('returns 404 for invalid module id', async (t) => {
    t.mock.method(Module, 'findById', async () => { throw new Error('CastError'); });
    const res = await verifyModulePermissions(makeRequest({
      'x-module-id': 'invalid',
      'x-module-scopes': 'auth:login',
    }));
    assert.equal(res.status, 404);
  });

  it('returns 404 when module does not exist', async (t) => {
    t.mock.method(Module, 'findById', async () => null);
    const res = await verifyModulePermissions(makeRequest({
      'x-module-id': new mongoose.Types.ObjectId().toString(),
      'x-module-scopes': 'auth:login',
    }));
    assert.equal(res.status, 404);
  });

  it('returns 401 when X-Module-Scopes is missing', async (t) => {
    t.mock.method(Module, 'findById', async () => ({ permissions: ['auth:login'] }));
    const res = await verifyModulePermissions(makeRequest({
      'x-module-id': new mongoose.Types.ObjectId().toString(),
    }));
    assert.equal(res.status, 401);
  });

  it('returns 403 when required permissions are missing', async (t) => {
    t.mock.method(Module, 'findById', async () => ({ permissions: [] }));
    const res = await verifyModulePermissions(makeRequest({
      'x-module-id': new mongoose.Types.ObjectId().toString(),
      'x-module-scopes': 'auth:login',
    }));
    assert.equal(res.status, 403);
  });

  it('allows request when permissions are satisfied', async (t) => {
    t.mock.method(Module, 'findById', async () => ({ permissions: ['auth:login'] }));
    const res = await verifyModulePermissions(makeRequest({
      'x-module-id': new mongoose.Types.ObjectId().toString(),
      'x-module-scopes': 'auth:login',
    }));
    assert.equal(res.status, 200);
  });
});
