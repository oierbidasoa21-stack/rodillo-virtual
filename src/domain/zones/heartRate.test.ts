import { describe, expect, it } from 'vitest';
import { hrPer10sToBpm } from './heartRate';

describe('hrPer10sToBpm', () => {
  it('multiplies a 10-second count by 6', () => {
    // 27 beats in 10 s → 27 × 6 = 162 bpm
    expect(hrPer10sToBpm(27)).toBe(162);
  });

  it('returns 0 for no beats', () => {
    expect(hrPer10sToBpm(0)).toBe(0);
  });
});
