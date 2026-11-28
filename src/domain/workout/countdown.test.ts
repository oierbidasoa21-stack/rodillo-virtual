import { describe, expect, it } from 'vitest';
import { bigCountdownDigit } from './countdown';

describe('big countdown', () => {
  it('shows 5…1 in the last five seconds, rounded up like the clock', () => {
    expect(bigCountdownDigit(5.4, true)).toBeNull();
    expect(bigCountdownDigit(5, true)).toBe(5);
    expect(bigCountdownDigit(4.2, true)).toBe(5);
    expect(bigCountdownDigit(0.3, true)).toBe(1);
  });

  it('hides when paused or when the block is over', () => {
    expect(bigCountdownDigit(3, false)).toBeNull();
    expect(bigCountdownDigit(0, true)).toBeNull();
  });
});
