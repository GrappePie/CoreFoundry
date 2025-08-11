import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { GET, POST } from '../schemaRegistry.controller';
import SchemaDefinition from '../schemaDefinition.model';

// In-memory store to mock database operations
const store: any[] = [];
(SchemaDefinition as any).create = async (doc: any) => {
  store.push(doc);
  return doc;
};
(SchemaDefinition as any).find = async () => store;

describe('schemaRegistry.controller', () => {
  it('creates and retrieves schemas', async () => {
    const reqPost = new Request('http://test/schemas', {
      method: 'POST',
      body: JSON.stringify({ $id: 'test-schema', version: '1.0.0', schema: { type: 'object' } }),
    });
    const resPost = await POST(reqPost);
    assert.equal(resPost.status, 201);

    const reqGet = new Request('http://test/schemas');
    const resGet = await GET(reqGet);
    const data = await resGet.json();
    assert.equal(Array.isArray(data), true);
    assert.equal(data.length, 1);
    assert.equal(data[0].schemaId, 'test-schema');
  });
});
