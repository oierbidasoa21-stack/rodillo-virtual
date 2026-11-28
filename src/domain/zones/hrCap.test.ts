import { describe, expect, it } from 'vitest';
import { capLabel, capTopBpm, isAboveCap, parseHrCap } from './hrCap';
import type { HrZone } from './zones';

// Same values as config/athlete.example.json
const zones: HrZone[] = [
  { id: 'Z1', label: 'Z1', min: 20, max: 21 },
  { id: 'Z2', label: 'Z2', min: 22, max: 23 },
  { id: 'Z3', label: 'Z3', min: 24, max: 25 },
  { id: 'Z4', label: 'Z4 (umbral)', min: 26, max: 27 },
  { id: 'Z5', label: 'Z5', min: 28, max: 28 },
  { id: 'Z6', label: 'Z6', min: 29, max: null },
];

describe('heart rate ceiling', () => {
  it('in ppm: above only past the number', () => {
    const cap = { type: 'bpm', bpm: 160 } as const;
    expect(isAboveCap(160, cap, zones)).toBe(false);
    expect(isAboveCap(161, cap, zones)).toBe(true);
  });

  it('"not above Z4": worked by hand, top of Z4 is 27 per 10 s', () => {
    const cap = { type: 'zone', zoneId: 'Z4' } as const;
    // 164 / 6 = 27.33 → 27, still Z4; 165 / 6 = 27.5 → 28, Z5.
    expect(isAboveCap(164, cap, zones)).toBe(false);
    expect(isAboveCap(165, cap, zones)).toBe(true);
    expect(capTopBpm(cap, zones)).toBe(164);
    expect(capLabel(cap, zones)).toBe('máx. Z4 (≤ 164 ppm)');
  });

  it('the last zone has no top, so it is never crossed', () => {
    const cap = { type: 'zone', zoneId: 'Z6' } as const;
    expect(isAboveCap(220, cap, zones)).toBe(false);
    expect(capTopBpm(cap, zones)).toBeNull();
  });

  it('reads stored values, old zone names included, and rejects the rest', () => {
    expect(parseHrCap({ type: 'bpm', bpm: 158.4 })).toEqual({ type: 'bpm', bpm: 158 });
    expect(parseHrCap({ type: 'zone', zoneId: 'UA' })).toEqual({ type: 'zone', zoneId: 'Z4' });
    expect(parseHrCap({ type: 'bpm', bpm: 30 })).toBeNull();
    expect(parseHrCap({ type: 'zone', zoneId: 'Z9' })).toBeNull();
    expect(parseHrCap(undefined)).toBeNull();
    expect(capLabel({ type: 'bpm', bpm: 150 }, zones)).toBe('máx. 150 ppm');
  });
});
