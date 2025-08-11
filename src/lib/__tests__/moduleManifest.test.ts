import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import Module from '../../models/Module';
import { validateManifest, ModuleManifest } from '../moduleManifest';

// Helper to run Mongoose pre-save hooks without DB
function runPreSave(doc: any) {
  return new Promise<void>((resolve, reject) => {
    (doc.constructor as any).schema.s.hooks.execPre('save', doc, (err: Error | null) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

describe('validateManifest', () => {
  it('accepts valid manifest with optional fields', () => {
    const manifest: ModuleManifest = {
      name: 'inventory',
      version: '1.0.0',
      description: 'Inventory module',
      endpoints: { rest: '/api/inventory', ws: '/ws/inventory' },
      schemas: { item: { type: 'object' } },
      dependencies: ['users'],
      events: { publish: ['item.updated'], subscribe: ['user.created'] },
    };
    assert.equal(validateManifest(manifest), true);
  });

  it('rejects manifest missing required fields', () => {
    const manifest: any = {
      version: '1.0.0',
      endpoints: { rest: '/api' },
      schemas: {},
    };
    assert.equal(validateManifest(manifest), false);
  });

  it('rejects manifest with invalid types', () => {
    const manifest: any = {
      name: 'test',
      version: 1,
      endpoints: { rest: '/api' },
      schemas: {},
    };
    assert.equal(validateManifest(manifest), false);
  });

  it('rejects manifest with unexpected properties', () => {
    const manifest: any = {
      name: 'test',
      version: '1.0.0',
      endpoints: { rest: '/api' },
      schemas: {},
      extra: true,
    };
    assert.equal(validateManifest(manifest), false);
  });

  it('rejects manifest with malformed nested events', () => {
    const manifest: any = {
      name: 'test',
      version: '1.0.0',
      endpoints: { rest: '/api' },
      schemas: {},
      events: { publish: 'not-array' },
    };
    assert.equal(validateManifest(manifest), false);
  });

  it('rejects manifest with non-object schemas', () => {
    const manifest: any = {
      name: 'test',
      version: '1.0.0',
      endpoints: { rest: '/api' },
      schemas: 'invalid',
    };
    assert.equal(validateManifest(manifest), false);
  });
});

describe('ModuleSchema pre-save', () => {
  it('allows saving with valid manifest', async () => {
    const manifest: ModuleManifest = {
      name: 'inventory',
      version: '1.0.0',
      endpoints: { rest: '/api/inventory' },
      schemas: {},
    };
    const mod = new Module({
      name: 'inventory',
      version: '1.0.0',
      description: '',
      ownerId: new mongoose.Types.ObjectId(),
      manifest,
      endpoints: { rest: '/api/inventory' },
    });
    await runPreSave(mod); // should not throw
  });

  it('rejects invalid manifest during save', async () => {
    const manifest: any = {
      name: 'inventory',
      version: '1.0.0',
      endpoints: { rest: '/api/inventory' },
      schemas: 'invalid',
    };
    const mod = new Module({
      name: 'inventory',
      version: '1.0.0',
      description: '',
      ownerId: new mongoose.Types.ObjectId(),
      manifest,
      endpoints: { rest: '/api/inventory' },
    });
    await assert.rejects(runPreSave(mod), /Invalid module manifest/);
  });
});

