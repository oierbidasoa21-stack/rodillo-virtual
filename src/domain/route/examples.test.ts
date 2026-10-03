import { describe, expect, it } from 'vitest';
import { builtinRoutes } from './examples';

const byId = (id: string) => {
  const r = builtinRoutes().find((x) => x.id === id);
  if (!r) throw new Error(`missing ${id}`);
  return r;
};

describe('built-in routes', () => {
  it('are three invented routes with unique ids', () => {
    expect(builtinRoutes().map((r) => r.id)).toEqual([
      'ej-embalse',
      'ej-puerto',
      'ej-rompepiernas',
    ]);
    expect(builtinRoutes().every((r) => r.source === 'builtin' && r.description)).toBe(true);
  });

  it('Vuelta al Embalse: 20 km and flat (under 1 %)', () => {
    const r = byId('ej-embalse');
    expect(r.distanceM).toBeCloseTo(20_000, -1);
    expect(r.maxGrade).toBeLessThan(0.01);
  });

  it('Puerto: 20 km, 8 km at 6 % = 480 m of climbing, steepest 7.5 %', () => {
    const r = byId('ej-puerto');
    expect(r.distanceM).toBeCloseTo(20_000, -1);
    // Approach ripples add a few metres; smoothing takes a little off the top
    expect(Math.abs(r.ascentM - 480)).toBeLessThan(15);
    expect(r.maxGrade).toBeGreaterThan(0.07);
    expect(r.maxGrade).toBeLessThan(0.076);
    // Average gradient of the climb itself, from the route: (ele at 11 km − at 3 km) / 8 km
    const at = (m: number) => r.points[m / 10]?.ele ?? NaN;
    expect((at(11_000) - at(3_000)) / 8000).toBeCloseTo(0.06, 3);
  });

  it('Rompepiernas: 15 km of short climbs between 3 and 8 %', () => {
    const r = byId('ej-rompepiernas');
    expect(r.distanceM).toBeCloseTo(15_000, -1);
    expect(r.maxGrade).toBeGreaterThan(0.06);
    expect(r.maxGrade).toBeLessThan(0.085);
  });

  it('are generated once', () => {
    expect(builtinRoutes()).toBe(builtinRoutes());
  });
});
