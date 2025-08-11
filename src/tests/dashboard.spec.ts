import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { redirectDashboard } from '../middleware/dashboard';
import { DASHBOARD_PATHS } from '../auth/roles';

function makeRequest(path: string, role: string) {
  const url = new URL('https://example.com' + path);
  const store: Record<string, string> = { 'x-user-role': role };
  return {
    nextUrl: url,
    url: url.toString(),
    headers: {
      get: (key: string) => store[key.toLowerCase()] ?? null,
    },
  } as any;
}

describe('redirectDashboard', () => {
  it('redirects to the path for the given role', () => {
    const res = redirectDashboard(makeRequest('/dashboard', 'owner'));
    assert.equal(res.headers.get('location'), 'https://example.com' + DASHBOARD_PATHS.owner);
  });

  it('does nothing when already at a role path', () => {
    const res = redirectDashboard(makeRequest('/dashboard/admin', 'admin'));
    assert.equal(res.headers.get('location'), null);
  });
});
