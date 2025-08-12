import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { registerModule, getModules } from '../moduleDiscovery';
import Module from '../../models/Module';

const store: any[] = [];

beforeEach(() => {
  store.length = 0;
});

(Module as any).create = async (doc: any) => {
  const moduleDoc = {
    ...doc,
    async save() {
      return this;
    },
  };
  store.push(moduleDoc);
  return moduleDoc;
};
(Module as any).find = async () => store;
(Module as any).findOne = async (query: any) =>
  store.find((m) => m.name === query.name && m.ownerId === query.ownerId) || null;

describe('moduleDiscovery service', () => {
  it('registers modules and lists them', async () => {
    const { integrationToken } = await registerModule({
      name: 'inventory',
      version: '1.0.0',
      ownerId: 'u1',
      manifest: {},
      endpoints: { rest: 'https://inventory.local/api' },
    });
    assert.equal(typeof integrationToken, 'string');
    const modules = await getModules();
    assert.equal(modules.length, 1);
    assert.equal(modules[0].integrationToken, integrationToken);
  });

  it('updates manifest when module already exists for owner', async () => {
    const first = await registerModule({
      name: 'inventory',
      version: '1.0.0',
      ownerId: 'u1',
      manifest: { a: 1 },
      endpoints: { rest: 'https://inventory.local/api' },
    });

    const second = await registerModule({
      name: 'inventory',
      version: '1.0.1',
      ownerId: 'u1',
      manifest: { b: 2 },
      endpoints: { rest: 'https://inventory.local/api/v2' },
    });

    assert.equal(store.length, 1);
    assert.equal(second.integrationToken, first.integrationToken);
    assert.deepEqual(second.module.manifest, { b: 2 });
    assert.equal(second.module.version, '1.0.1');
  });

  it('rejects invalid rest endpoint URL', async () => {
    await assert.rejects(
      () =>
        registerModule({
          name: 'inventory',
          version: '1.0.0',
          ownerId: 'u1',
          manifest: {},
          endpoints: { rest: 'not-a-url' },
        }),
      /endpoints\.rest must be a valid URL/
    );
  });
});
