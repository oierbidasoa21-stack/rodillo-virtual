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

  it('defaults the wheel to 2155 mm (700×32) when the file has none', () => {
    const older: Record<string, unknown> = { ...example };
    delete older.wheelCircumferenceMm;
    const result = parseAthleteConfig(older);
    expect(result.ok && result.value.wheelCircumferenceMm).toBe(2155);
  });

  it('has no FTP unless the file brings one', () => {
    expect(
      parseAthleteConfig(example).ok &&
        (parseAthleteConfig(example) as { value: { ftp: unknown } }).value.ftp,
    ).toBeNull();
    const withFtp = parseAthleteConfig({
      ...example,
      ftp: { watts: 245.4, source: 'ramp', dateMs: 5 },
    });
    expect(withFtp.ok && withFtp.value.ftp).toEqual({ watts: 245, source: 'ramp', dateMs: 5 });
    const manual = parseAthleteConfig({ ...example, ftp: { watts: 200 } });
    expect(manual.ok && manual.value.ftp).toEqual({ watts: 200, source: 'manual', dateMs: 0 });
  });

  it('rejects an implausible FTP', () => {
    expect(parseAthleteConfig({ ...example, ftp: { watts: 20 } }).ok).toBe(false);
    expect(parseAthleteConfig({ ...example, ftp: 250 }).ok).toBe(false);
  });

  it('rejects an implausible wheel circumference', () => {
    expect(parseAthleteConfig({ ...example, wheelCircumferenceMm: 500 }).ok).toBe(false);
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
