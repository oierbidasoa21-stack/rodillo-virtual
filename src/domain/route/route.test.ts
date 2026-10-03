import { describe, expect, it } from 'vitest';
import type { GpxPoint } from './gpx';
import { buildRoute, haversineM, segmentGrade } from './route';

const META = { id: 't', name: 'Test', source: 'gpx' as const };
/** 1° of latitude on a sphere of 6371 km: 2π·6371000/360 = 111 194.9 m. */
const M_PER_DEG_LAT = (2 * Math.PI * 6_371_000) / 360;

/** Straight north from (0, 0), `metres` long, elevation from `ele(d)`. */
function northTrack(metres: number, every: number, ele: (d: number) => number | null): GpxPoint[] {
  const pts: GpxPoint[] = [];
  for (let d = 0; d <= metres; d += every)
    pts.push({ lat: d / M_PER_DEG_LAT, lon: 0, ele: ele(d) });
  return pts;
}

describe('haversineM', () => {
  it('1° of latitude ≈ 111 195 m; 1° of longitude at 60° is half', () => {
    expect(haversineM({ lat: 0, lon: 0 }, { lat: 1, lon: 0 })).toBeCloseTo(M_PER_DEG_LAT, 3);
    expect(haversineM({ lat: 60, lon: 0 }, { lat: 60, lon: 1 })).toBeCloseTo(M_PER_DEG_LAT / 2, -1);
  });
});

describe('buildRoute', () => {
  it('resamples 1 km every 10 m: 101 points', () => {
    const route = buildRoute(
      northTrack(1000, 250, () => 100),
      META,
    );
    expect(route?.points).toHaveLength(101);
    expect(route?.distanceM).toBeCloseTo(1000, 6);
    expect(route?.points[50]?.distanceM).toBe(500);
  });

  it('a steady 10 % ramp: 10 m up every 100 m, 100 m of ascent per km', () => {
    const route = buildRoute(
      northTrack(1000, 100, (d) => d * 0.1),
      META,
    );
    if (!route) throw new Error('no route');
    expect(segmentGrade(route.points, 40)).toBeCloseTo(0.1, 9);
    expect(route.ascentM).toBeCloseTo(100, 6);
    expect(route.descentM).toBeCloseTo(0, 6);
    expect(route.maxGrade).toBeCloseTo(0.1, 9);
    // Smoothing keeps the ends where they were
    expect(route.points[0]?.ele).toBeCloseTo(0, 9);
    expect(route.points.at(-1)?.ele).toBeCloseTo(100, 9);
  });

  it('smooths a 1-point GPS spike instead of turning it into a wall', () => {
    const spiky = northTrack(500, 10, (d) => (d === 250 ? 110 : 100));
    const route = buildRoute(spiky, META);
    if (!route) throw new Error('no route');
    // Raw: +10 m in 10 m = 100 %. Triangular weights 1…6…1 (sum 36):
    // the spike adds 10·6/36 = 1.67 m at its centre and 10/36 = 0.28 m per 10 m step.
    expect(route.points[25]?.ele).toBeCloseTo(100 + (10 * 6) / 36, 6);
    expect(route.maxGrade).toBeCloseTo(10 / 36 / 10, 6); // 2.8 %
  });

  it('clamps gradients to ±25 %', () => {
    const cliff = buildRoute(
      northTrack(100, 10, (d) => d * 2),
      META,
    );
    expect(cliff?.maxGrade).toBe(0.25);
  });

  it('fills missing elevations by interpolation', () => {
    const route = buildRoute(
      northTrack(200, 100, (d) => (d === 100 ? null : d / 10)),
      META,
    );
    // 0 → (missing → 10) → 20: smooth straight line
    expect(route?.points[10]?.ele).toBeCloseTo(10, 6);
  });

  it('ignores repeated points and rejects tracks with no length', () => {
    const still = [
      { lat: 1, lon: 1, ele: 5 },
      { lat: 1, lon: 1, ele: 6 },
    ];
    expect(buildRoute(still, META)).toBeNull();
    const withDupes = northTrack(100, 50, () => 0);
    const route = buildRoute([withDupes[0]!, withDupes[0]!, ...withDupes.slice(1)], META);
    expect(route?.distanceM).toBeCloseTo(100, 6);
  });
});
