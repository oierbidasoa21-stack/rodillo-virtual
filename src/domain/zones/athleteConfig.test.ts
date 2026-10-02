import { describe, expect, it } from 'vitest';
import example from '../../../config/athlete.example.json';
import { parseAthleteConfig } from './athleteConfig';

describe('parseAthleteConfig', () => {
  it('accepts the committed example config', () => {
    const result = parseAthleteConfig(example);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.weightKg).toBe(70);
      expect(result.value.hrZonesPer10s).toHaveLength(6);
      expect(result.value.hrZonesPer10s[5]?.max).toBeNull();
    }
  });

  it('falls back to the id when a label is missing', () => {
    const zones = example.hrZonesPer10s.map(({ id, min, max }) => ({ id, min, max }));
    const result = parseAthleteConfig({ ...example, hrZonesPer10s: zones });
    expect(result.ok && result.value.hrZonesPer10s[3]?.label).toBe('UA');
  });

  it('rejects non-objects', () => {
    expect(parseAthleteConfig(null)).toEqual({
      ok: false,
      errors: ['El archivo no contiene un objeto JSON.'],
    });
    expect(parseAthleteConfig([1, 2]).ok).toBe(false);
  });

  it('reports out-of-range weights', () => {
    const result = parseAthleteConfig({ ...example, weightKg: 10, bikeWeightKg: '9' });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors).toHaveLength(2);
  });

  it('reports malformed zones and zone rule violations', () => {
    const unknownId = parseAthleteConfig({
      ...example,
      hrZonesPer10s: [{ id: 'Z9', min: 1, max: 2 }],
    });
    expect(!unknownId.ok && unknownId.errors[0]).toMatch(/hrZonesPer10s\[0\]/);

    const gap = parseAthleteConfig({
      ...example,
      hrZonesPer10s: example.hrZonesPer10s.map((z) => (z.id === 'L2' ? { ...z, min: 30 } : z)),
    });
    expect(gap.ok).toBe(false);
  });
});
