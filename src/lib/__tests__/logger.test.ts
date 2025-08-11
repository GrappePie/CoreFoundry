import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import logger from '../logger';

describe('logger', () => {
  it('exposes standard logging methods', () => {
    assert.equal(typeof logger.info, 'function');
    assert.equal(typeof logger.warn, 'function');
    assert.equal(typeof logger.error, 'function');
    assert.equal(typeof logger.debug, 'function');
  });
});
