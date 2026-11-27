import { describe, expect, it } from 'vitest';
import { migrateLegacyZoneIds } from './legacy';
import { toZoneId } from './zones';

describe('legacy zone names', () => {
  it('reads old names as the new ones and rejects anything else', () => {
    expect(['L1', 'L2', 'L3', 'UA', 'UA+', 'VO2'].map(toZoneId)).toEqual([
      'Z1',
      'Z2',
      'Z3',
      'Z4',
      'Z5',
      'Z6',
    ]);
    expect(toZoneId('Z4')).toBe('Z4');
    expect(toZoneId('Z7')).toBeNull();
    expect(toZoneId(4)).toBeNull();
  });

  it('renames block targets, counts and seconds per zone anywhere in a value', () => {
    const old = {
      name: 'UA',
      blocks: [
        { type: 'block', target: { type: 'hr', zoneId: 'UA+' }, note: 'UA sostenido' },
        { type: 'repeat', items: [{ target: { type: 'hr', zoneId: 'L1' } }] },
      ],
      counts: [{ targetZoneId: 'VO2', valuePer10s: 29 }],
      plannedSecByZone: { L1: 60, L2: 0, L3: 0, UA: 120, 'UA+': 0, VO2: 0 },
      hrMeasured: { secByZone: { L1: 1, L2: 2, L3: 3, UA: 4, 'UA+': 5, VO2: 6 } },
      power: { secByPowerZone: { Z1: 10, Z5: 20 } },
    };
    expect(migrateLegacyZoneIds(old)).toEqual({
      name: 'UA', // free text is left alone
      blocks: [
        { type: 'block', target: { type: 'hr', zoneId: 'Z5' }, note: 'UA sostenido' },
        { type: 'repeat', items: [{ target: { type: 'hr', zoneId: 'Z1' } }] },
      ],
      counts: [{ targetZoneId: 'Z6', valuePer10s: 29 }],
      plannedSecByZone: { Z1: 60, Z2: 0, Z3: 0, Z4: 120, Z5: 0, Z6: 0 },
      hrMeasured: { secByZone: { Z1: 1, Z2: 2, Z3: 3, Z4: 4, Z5: 5, Z6: 6 } },
      power: { secByPowerZone: { Z1: 10, Z5: 20 } }, // power zones untouched
    });
  });

  it('renames athlete zones, replacing example labels but keeping the user’s own', () => {
    const athlete = {
      hrZonesPer10s: [
        { id: 'L1', label: 'L1', min: 20, max: 21 },
        { id: 'UA', label: 'UA (umbral)', min: 26, max: 27 },
        { id: 'VO2', label: 'Mis sprints', min: 29, max: null },
      ],
    };
    expect(migrateLegacyZoneIds(athlete).hrZonesPer10s).toEqual([
      { id: 'Z1', label: 'Z1', min: 20, max: 21 },
      { id: 'Z4', label: 'Z4 (umbral)', min: 26, max: 27 },
      { id: 'Z6', label: 'Mis sprints', min: 29, max: null },
    ]);
  });

  it('leaves data already on Z1…Z6 as it is, and does not change the input', () => {
    const current = { target: { type: 'hr', zoneId: 'Z3' }, actualSecByZone: { Z3: 9 } };
    expect(migrateLegacyZoneIds(current)).toEqual(current);
    const old = { zoneId: 'L2' };
    migrateLegacyZoneIds(old);
    expect(old.zoneId).toBe('L2');
  });
});
