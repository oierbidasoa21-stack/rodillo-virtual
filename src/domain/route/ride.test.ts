import { describe, expect, it } from 'vitest';
import type { GpxPoint } from './gpx';
import { positionAt } from './position';
import { type RideInput, type RideState, advanceRide, startRide } from './ride';
import { buildRoute } from './route';

const M_PER_DEG_LAT = (2 * Math.PI * 6_371_000) / 360;
function straight(metres: number, ele: (d: number) => number) {
  const pts: GpxPoint[] = [];
  for (let d = 0; d <= metres; d += 10) pts.push({ lat: d / M_PER_DEG_LAT, lon: 0, ele: ele(d) });
  const route = buildRoute(pts, { id: 'r', name: 'R', source: 'builtin' });
  if (!route) throw new Error('no route');
  return route;
}

const flat = straight(2000, () => 100);
const climb = straight(2000, (d) => d * 0.06);
const descent = straight(2000, (d) => 120 - d * 0.06);
const MASS = 90.6;
const power = (powerW: number | null): RideInput => ({ mode: 'power', powerW, massKg: MASS });

/** Ticks of 0.2 s, like the player. */
function ride(state: RideState, route = flat, seconds: number, input: RideInput, loop = false) {
  let s = state;
  for (let i = 0; i < Math.round(seconds / 0.2); i++) s = advanceRide(s, route, 0.2, input, loop);
  return s;
}

describe('positionAt', () => {
  it('reads elevation and grade, and repeats on a loop', () => {
    expect(positionAt(climb, 505).ele).toBeCloseTo(30.3, 6);
    expect(positionAt(climb, 505).grade).toBeCloseTo(0.06, 9);
    expect(positionAt(climb, 2500).lapDistanceM).toBeCloseTo(2000, 6);
    const looped = positionAt(climb, 2500, true);
    expect(looped.lap).toBe(1);
    expect(looped.lapDistanceM).toBeCloseTo(500, 6);
  });
});

describe('advanceRide, power mode', () => {
  it('246.6 W on the flat settles at 10 m/s (hand case of virtualSpeed)', () => {
    const s = ride(startRide(), flat, 60, power(246.6));
    expect(s.speedMs).toBeCloseTo(10, 2);
  });

  it('at a steady 10 m/s, 1 km takes 100 s', () => {
    const cruising = { ...startRide(), speedMs: 10 };
    const s = ride(cruising, flat, 100, power(246.6));
    expect(s.distanceM).toBeCloseTo(1000, 0);
  });

  it('eases into speed instead of jumping (inertia)', () => {
    const s = ride(startRide(), flat, 4, power(246.6));
    // After one time constant: 1 − e⁻¹ = 63 % of 10 m/s
    expect(s.speedMs).toBeCloseTo(6.32, 1);
  });

  it('is slower on a 6 % climb and rolls downhill without pedalling', () => {
    const up = ride(startRide(), climb, 60, power(246.6));
    expect(up.speedMs).toBeLessThan(5);
    const down = ride(startRide(), descent, 60, power(0));
    expect(down.speedMs).toBeGreaterThan(10);
    // No power reading on the flat: you coast to a stop, nothing is made up
    expect(ride({ ...startRide(), speedMs: 10 }, flat, 120, power(null)).speedMs).toBeLessThan(0.5);
  });

  it('counts the climbing done', () => {
    const s = ride({ ...startRide(), speedMs: 8 }, climb, 600, power(400));
    expect(s.finished).toBe(true);
    expect(s.distanceM).toBeCloseTo(2000, 6);
    expect(s.ascentM).toBeCloseTo(climb.ascentM, 6);
  });
});

describe('advanceRide, wheel mode (no trainer curve)', () => {
  it('moves at the wheel speed and ignores the slope: 36 km/h for 100 s = 1 km', () => {
    const wheel: RideInput = { mode: 'wheel', wheelSpeedKmh: 36 };
    expect(ride(startRide(), flat, 100, wheel).distanceM).toBeCloseTo(1000, 6);
    expect(ride(startRide(), climb, 100, wheel).distanceM).toBeCloseTo(1000, 6);
  });

  it('stops without a speed reading', () => {
    expect(ride(startRide(), flat, 10, { mode: 'wheel', wheelSpeedKmh: null }).distanceM).toBe(0);
  });
});

describe('laps', () => {
  it('a loop keeps going and does not count the jump back to the start as climbing', () => {
    const wheel: RideInput = { mode: 'wheel', wheelSpeedKmh: 36 };
    const s = ride(startRide(), climb, 450, wheel, true); // 4.5 km on a 2 km loop
    expect(s.finished).toBe(false);
    expect(positionAt(climb, s.distanceM, true)).toMatchObject({ lap: 2 });
    // Two full climbs of 120 m plus 500 m of the third (30 m)
    expect(s.ascentM).toBeCloseTo(2 * climb.ascentM + 30, 0);
  });

  it('integrates a long gap in steps (throttled tab)', () => {
    const a = advanceRide({ ...startRide(), speedMs: 10 }, flat, 30, power(246.6));
    expect(a.distanceM).toBeCloseTo(300, 0);
  });
});
