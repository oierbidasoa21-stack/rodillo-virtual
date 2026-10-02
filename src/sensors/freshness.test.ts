import { describe, expect, it } from 'vitest';
import { isFresh } from './freshness';

describe('isFresh', () => {
  it('accepts readings up to 5 s old', () => {
    expect(isFresh({ atMs: 1000 }, 1000)).toBe(true);
    expect(isFresh({ atMs: 1000 }, 6000)).toBe(true);
    expect(isFresh({ atMs: 1000 }, 6001)).toBe(false);
  });

  it('rejects missing readings and readings from the future', () => {
    expect(isFresh(null, 1000)).toBe(false);
    expect(isFresh(undefined, 1000)).toBe(false);
    expect(isFresh({ atMs: 2000 }, 1000)).toBe(false);
  });
});
