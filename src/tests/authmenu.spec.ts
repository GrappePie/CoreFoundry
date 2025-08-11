import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('AuthMenu', () => {
  it('contains a dashboard link', () => {
    const content = readFileSync(join(process.cwd(), 'src/components/AuthMenu.tsx'), 'utf-8');
    assert.ok(content.includes('href="/dashboard"'));
  });
});
