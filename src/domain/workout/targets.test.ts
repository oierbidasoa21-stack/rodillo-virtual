import { describe, expect, it } from 'vitest';
import { powerBand, powerStatus, targetWatts } from './targets';

describe('power targets', () => {
  it('converts targets to watts', () => {
    expect(targetWatts({ type: 'watts', watts: 240 }, null)).toBe(240);
    // 88 % of 240 W = 211.2 W
    expect(targetWatts({ type: 'power', pctFtp: 88 }, 240)).toBeCloseTo(211.2, 9);
    expect(targetWatts({ type: 'power', pctFtp: 88 }, null)).toBeNull();
    expect(targetWatts({ type: 'hr', zoneId: 'L2' }, 240)).toBeNull();
  });

  it('band is ±5 %: 211.2 W → 201–222 W', () => {
    expect(powerBand(211.2)).toEqual({ minW: 201, maxW: 222 });
  });

  it('classifies measured power against the band', () => {
    expect(powerStatus(200, 211.2)).toBe('below');
    expect(powerStatus(201, 211.2)).toBe('in');
    expect(powerStatus(222, 211.2)).toBe('in');
    expect(powerStatus(223, 211.2)).toBe('above');
  });
});
