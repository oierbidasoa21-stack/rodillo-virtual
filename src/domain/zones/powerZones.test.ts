import { describe, expect, it } from 'vitest';
import { powerZoneOfPct, powerZoneOfWatts, powerZones } from './powerZones';

describe('power zones (Coggan)', () => {
  it('in watts for FTP 200', () => {
    expect(powerZones(200).map((z) => [z.id, z.minW, z.maxW])).toEqual([
      ['Z1', 0, 111],
      ['Z2', 112, 151],
      ['Z3', 152, 181],
      ['Z4', 182, 211],
      ['Z5', 212, 241],
      ['Z6', 242, 301],
      ['Z7', 302, null],
    ]);
  });

  it('classifies a % of FTP at the boundaries', () => {
    expect(powerZoneOfPct(0.55)).toBe('Z1');
    expect(powerZoneOfPct(0.56)).toBe('Z2');
    expect(powerZoneOfPct(0.88)).toBe('Z3');
    expect(powerZoneOfPct(0.91)).toBe('Z4');
    expect(powerZoneOfPct(1.05)).toBe('Z4');
    expect(powerZoneOfPct(1.2)).toBe('Z5');
    expect(powerZoneOfPct(1.5)).toBe('Z6');
    expect(powerZoneOfPct(2)).toBe('Z7');
  });

  it('classifies watts against an FTP', () => {
    expect(powerZoneOfWatts(250, 250)).toBe('Z4');
    expect(powerZoneOfWatts(100, 250)).toBe('Z1');
  });
});
