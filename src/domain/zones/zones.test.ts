import { describe, expect, it } from 'vitest';
import { type HrZone, classifyPer10s, findZone, validateZones, zoneStatus } from './zones';

// Same values as config/athlete.example.json
const ZONES: HrZone[] = [
  { id: 'L1', label: 'L1', min: 20, max: 21 },
  { id: 'L2', label: 'L2', min: 22, max: 23 },
  { id: 'L3', label: 'L3', min: 24, max: 25 },
  { id: 'UA', label: 'UA (umbral)', min: 26, max: 27 },
  { id: 'UA+', label: 'UA+', min: 28, max: 28 },
  { id: 'VO2', label: 'VO2', min: 29, max: null },
];

describe('classifyPer10s', () => {
  it('returns null below the first zone', () => {
    expect(classifyPer10s(19, ZONES)).toBeNull();
  });

  it('finds the zone at both bounds', () => {
    expect(classifyPer10s(20, ZONES)?.id).toBe('L1');
    expect(classifyPer10s(21, ZONES)?.id).toBe('L1');
    expect(classifyPer10s(22, ZONES)?.id).toBe('L2');
    expect(classifyPer10s(28, ZONES)?.id).toBe('UA+');
  });

  it('puts anything from the last zone up in the open-ended zone', () => {
    expect(classifyPer10s(29, ZONES)?.id).toBe('VO2');
    expect(classifyPer10s(40, ZONES)?.id).toBe('VO2');
  });

  it('handles fractional values from a live bpm (150 bpm / 6 = 25)', () => {
    expect(classifyPer10s(150 / 6, ZONES)?.id).toBe('L3');
    // 129 bpm / 6 = 21.5, past L1's top (21) → next zone
    expect(classifyPer10s(129 / 6, ZONES)?.id).toBe('L2');
  });
});

describe('zoneStatus', () => {
  const ua = findZone(ZONES, 'UA');

  it('compares against the target zone bounds', () => {
    expect(zoneStatus(25, ua)).toBe('below');
    expect(zoneStatus(26, ua)).toBe('in');
    expect(zoneStatus(27, ua)).toBe('in');
    expect(zoneStatus(28, ua)).toBe('above');
  });

  it('never reports above for an open-ended zone', () => {
    expect(zoneStatus(45, findZone(ZONES, 'VO2'))).toBe('in');
  });
});

describe('validateZones', () => {
  it('accepts contiguous zones', () => {
    expect(validateZones(ZONES)).toEqual([]);
  });

  it('rejects a gap between zones', () => {
    const gap = ZONES.map((z) => (z.id === 'L2' ? { ...z, min: 23 } : z));
    expect(validateZones(gap)).toEqual(['L2: tiene que empezar en 22, justo después de L1.']);
  });

  it('rejects max below min and an open end that is not last', () => {
    const bad = ZONES.map((z) =>
      z.id === 'L3' ? { ...z, max: 23 } : z.id === 'UA' ? { ...z, max: null } : z,
    );
    const errors = validateZones(bad);
    expect(errors).toContain('L3: el final tiene que ser un entero mayor o igual que el inicio.');
    expect(errors).toContain('UA: solo la última zona puede no tener final.');
  });

  it('rejects missing or reordered zones', () => {
    expect(validateZones(ZONES.slice(1))).toHaveLength(1);
    expect(validateZones([...ZONES].reverse())).toHaveLength(1);
  });
});
