import { describe, expect, it } from 'vitest';
import { expandWorkout } from '../workout/expand';
import { BUILTIN_WORKOUTS } from '../workout/library';
import { kcalByMet } from './kcal';
import { zoneLoad } from './load';
import { actualSecByZone, emptySecByZone, plannedSecByZone } from './timeInZone';

const fondo = expandWorkout(BUILTIN_WORKOUTS.find((w) => w.id === 'b-fondo')?.blocks ?? []);

describe('time in zone', () => {
  it('sums planned seconds per zone', () => {
    // Fondo Z2: 10′ Z1 + 55′ Z2 + 5′ Z1
    expect(plannedSecByZone(fondo)).toEqual({ ...emptySecByZone(), Z1: 900, Z2: 3300 });
  });

  it('sums actual seconds per zone from per-step timings', () => {
    expect(actualSecByZone(fondo, [600, 1000, 0])).toEqual({
      ...emptySecByZone(),
      Z1: 600,
      Z2: 1000,
    });
  });
});

describe('zoneLoad', () => {
  it('Fondo Z2: 15′ × 1 + 55′ × 2 = 125', () => {
    expect(zoneLoad(plannedSecByZone(fondo))).toBeCloseTo(125, 9);
  });

  it('weights every zone: 1′ in each = 1+2+3+4+5+6 = 21', () => {
    const oneMinEach = { Z1: 60, Z2: 60, Z3: 60, Z4: 60, Z5: 60, Z6: 60 };
    expect(zoneLoad(oneMinEach)).toBeCloseTo(21, 9);
  });

  it('is zero with no time', () => {
    expect(zoneLoad(emptySecByZone())).toBe(0);
  });
});

describe('kcalByMet', () => {
  it('Fondo Z2 at 70 kg: 5.0·70·0.25 + 6.8·70·(55/60) = 87.5 + 436.33 = 523.83', () => {
    expect(kcalByMet(plannedSecByZone(fondo), 70)).toBeCloseTo(523.833, 2);
  });

  it('1 h in Z4 at 80 kg = 11 · 80 = 880', () => {
    expect(kcalByMet({ ...emptySecByZone(), Z4: 3600 }, 80)).toBeCloseTo(880, 9);
  });

  it('scales linearly with weight', () => {
    const t = plannedSecByZone(fondo);
    expect(kcalByMet(t, 80) / kcalByMet(t, 40)).toBeCloseTo(2, 9);
  });
});
