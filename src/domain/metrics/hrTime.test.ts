import { describe, expect, it } from 'vitest';
import type { HrZone } from '../zones/zones';
import { addHrSample, averageBpm, emptyHrTime } from './hrTime';
import { emptySecByZone } from './timeInZone';

// Same values as config/athlete.example.json
const ZONES: HrZone[] = [
  { id: 'Z1', label: 'Z1', min: 20, max: 21 },
  { id: 'Z2', label: 'Z2', min: 22, max: 23 },
  { id: 'Z3', label: 'Z3', min: 24, max: 25 },
  { id: 'Z4', label: 'Z4', min: 26, max: 27 },
  { id: 'Z5', label: 'Z5', min: 28, max: 28 },
  { id: 'Z6', label: 'Z6', min: 29, max: null },
];

describe('addHrSample', () => {
  it('accumulates time per zone, below the zones, average and max', () => {
    let acc = emptyHrTime();
    acc = addHrSample(acc, 150, 120, ZONES); // 150/6 = 25 → Z3
    acc = addHrSample(acc, 114, 60, ZONES); // 114/6 = 19 → below Z1
    expect(acc.secByZone).toEqual({ ...emptySecByZone(), Z3: 120 });
    expect(acc.belowSec).toBe(60);
    expect(acc.coveredSec).toBe(180);
    expect(acc.maxBpm).toBe(150);
    // (150·120 + 114·60) / 180 = 138
    expect(averageBpm(acc)).toBeCloseTo(138, 9);
  });

  it('classifies like a hand count: ppm/6 rounded', () => {
    // 129/6 = 21.5 → 22 → Z2; 128/6 = 21.33 → 21 → Z1
    expect(addHrSample(emptyHrTime(), 129, 1, ZONES).secByZone.Z2).toBe(1);
    expect(addHrSample(emptyHrTime(), 128, 1, ZONES).secByZone.Z1).toBe(1);
  });

  it('counts nothing without a fresh reading', () => {
    const acc = emptyHrTime();
    expect(addHrSample(acc, null, 5, ZONES)).toBe(acc);
    expect(averageBpm(acc)).toBeNull();
  });
});
