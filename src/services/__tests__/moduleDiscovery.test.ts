import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { registerModule, getModules } from '../moduleDiscovery';
import Module from '../../models/Module';

const store: any[] = [];
(Module as any).create = async (doc: any) => {
  store.push(doc);
  return doc;
};
(Module as any).find = async () => store;

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
});
