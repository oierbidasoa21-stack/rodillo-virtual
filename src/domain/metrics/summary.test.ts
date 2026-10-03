import { describe, expect, it } from 'vitest';
import { expandWorkout } from '../workout/expand';
import { createPlayer, skip, tick, togglePlay } from '../workout/player';
import { makeBlock } from '../workout/types';
import type { HrZone } from '../zones/zones';
import { addHrSample, emptyHrTime } from './hrTime';
import {
  type SessionSummary,
  buildRideSummary,
  buildSessionSummary,
  hasKcal,
  hasLoad,
  recentTotals,
  rideSummaryOf,
} from './summary';
import { emptySecByZone } from './timeInZone';

describe('buildSessionSummary', () => {
  it('uses the time actually ridden, not the plan', () => {
    // Plan: 10′ L1 + 20′ L2. Ride 10′ L1, then skip L2 after 5′.
    const steps = expandWorkout([makeBlock(600, 'L1'), makeBlock(1200, 'L2')]);
    let p = togglePlay(createPlayer(steps)).state;
    p = tick(p, 900).state; // 600 s L1 + 300 s L2
    p = skip(p).state; // finishes

    const s = buildSessionSummary({
      id: 'x',
      dateMs: 0,
      workoutName: 'Test',
      player: p,
      weightKg: 80,
    });

    expect(s.durationSec).toBe(900);
    expect(s.plannedSecByZone).toEqual({ ...emptySecByZone(), L1: 600, L2: 1200 });
    expect(s.actualSecByZone).toEqual({ ...emptySecByZone(), L1: 600, L2: 300 });
    // load: 10′ × 1 + 5′ × 2 = 20
    expect(s.load).toBeCloseTo(20, 9);
    // kcal: 5.0·80·(600/3600) + 6.8·80·(300/3600) = 66.667 + 45.333 = 112
    expect(s.kcalEstimated).toBeCloseTo(112, 6);
  });
});

describe('buildSessionSummary with heart rate', () => {
  const zones: HrZone[] = [
    { id: 'L1', label: 'L1', min: 20, max: 21 },
    { id: 'L2', label: 'L2', min: 22, max: 23 },
    { id: 'L3', label: 'L3', min: 24, max: 25 },
    { id: 'UA', label: 'UA', min: 26, max: 27 },
    { id: 'UA+', label: 'UA+', min: 28, max: 28 },
    { id: 'VO2', label: 'VO2', min: 29, max: null },
  ];
  const ridden = () => {
    const steps = expandWorkout([makeBlock(180, 'L2')]);
    return tick(togglePlay(createPlayer(steps)).state, 180).state;
  };

  it('uses measured time in zone when there is at least a minute of readings', () => {
    let hr = emptyHrTime();
    hr = addHrSample(hr, 150, 120, zones); // L3
    hr = addHrSample(hr, 114, 60, zones); // below L1
    const s = buildSessionSummary({
      id: 'x',
      dateMs: 0,
      workoutName: 'HR',
      player: ridden(),
      weightKg: 70,
      hr,
      hrSimulated: true,
    });
    // load: 2′ × 3 + 1′ × 0.5 = 6.5
    expect(s.load).toBeCloseTo(6.5, 9);
    // kcal: 8.8·70·(120/3600) + 3.5·70·(60/3600) = 20.533 + 4.083 = 24.617
    expect(s.kcalEstimated).toBeCloseTo(24.617, 3);
    expect(s.hrMeasured).toMatchObject({
      belowSec: 60,
      coveredSec: 180,
      avgBpm: 138,
      maxBpm: 150,
      simulated: true,
    });
    // The block-based time is still kept for planned vs ridden
    expect(s.actualSecByZone.L2).toBe(180);
  });

  it('falls back to the blocks with under a minute of readings', () => {
    const hr = addHrSample(emptyHrTime(), 150, 59, zones);
    const s = buildSessionSummary({
      id: 'x',
      dateMs: 0,
      workoutName: 'HR',
      player: ridden(),
      weightKg: 70,
      hr,
    });
    expect(s.hrMeasured).toBeUndefined();
    // 3′ in L2 × 2 = 6
    expect(s.load).toBeCloseTo(6, 9);
  });
});

describe('recentTotals', () => {
  const day = 86_400_000;
  const session = (dateMs: number, durationSec: number, load: number): SessionSummary => ({
    id: String(dateMs),
    dateMs,
    workoutName: 'S',
    durationSec,
    load,
    kcalEstimated: 0,
    plannedSecByZone: emptySecByZone(),
    actualSecByZone: emptySecByZone(),
    counts: [],
  });

  it('only counts sessions within the window', () => {
    const now = 100 * day;
    const totals = recentTotals(
      [
        session(now - 1 * day, 3600, 100),
        session(now - 6.9 * day, 1800, 50),
        session(now - 7 * day, 999, 999),
      ],
      now,
    );
    expect(totals).toEqual({ count: 2, durationSec: 5400, load: 150 });
  });
});

describe('buildSessionSummary with estimated power', () => {
  const ridden = () => {
    const steps = expandWorkout([makeBlock(120, { type: 'power', pctFtp: 100 })]);
    return tick(togglePlay(createPlayer(steps)).state, 120).state;
  };
  const constant = (w: number, sec: number) => Array.from({ length: sec }, () => w);

  it('2′ at 200 W with FTP 200: NP 200, IF 1, TSS 3.33, 24 kJ ≈ 24 kcal, all in Z4', () => {
    const s = buildSessionSummary({
      id: 'p',
      dateMs: 0,
      workoutName: 'Potencia',
      player: ridden(),
      weightKg: 70,
      powerSamples: constant(200, 120),
      powerSimulated: true,
      ftpW: 200,
    });
    expect(s.power).toMatchObject({
      avgW: 200,
      maxW: 200,
      kJ: 24,
      coveredSec: 120,
      estimated: true,
      simulated: true,
    });
    expect(s.power?.npW).toBeCloseTo(200, 9);
    expect(s.power?.ifactor).toBeCloseTo(1, 9);
    // 120·200·1 / (200·3600) · 100 = 3.333
    expect(s.power?.tss).toBeCloseTo(3.333, 3);
    expect(s.power?.secByPowerZone?.Z4).toBe(120);
    expect(s.kcalEstimated).toBeCloseTo(24, 9);
  });

  it('without FTP there is no IF, TSS or power zones (ramp test)', () => {
    const s = buildSessionSummary({
      id: 'p',
      dateMs: 0,
      workoutName: 'Ramp',
      player: ridden(),
      weightKg: 70,
      powerSamples: constant(250, 90),
      ftpW: null,
    });
    expect(s.power).toMatchObject({ avgW: 250, ifactor: null, tss: null, secByPowerZone: null });
    expect(s.power?.kJ).toBeCloseTo(22.5, 9);
  });

  it('under a minute of power: no power metrics, kcal from MET', () => {
    const s = buildSessionSummary({
      id: 'p',
      dateMs: 0,
      workoutName: 'Corta',
      player: ridden(),
      weightKg: 70,
      powerSamples: constant(200, 59),
      ftpW: 200,
    });
    expect(s.power).toBeUndefined();
  });
});

describe('buildRideSummary', () => {
  const route = { id: 'ej-puerto', name: 'Puerto' };
  const ride = { distanceM: 12_000, ascentM: 480, elapsedSec: 2400 };

  it('records distance, climbing and average speed: 12 km in 40′ = 18 km/h', () => {
    const s = buildRideSummary({ id: 'r', dateMs: 0, route, ride, mode: 'power', weightKg: 70 });
    expect(s.workoutName).toBe('Puerto');
    expect(s.durationSec).toBe(2400);
    expect(s.ride).toEqual({
      routeId: 'ej-puerto',
      routeName: 'Puerto',
      distanceM: 12_000,
      ascentM: 480,
      avgSpeedKmh: 18,
      mode: 'power',
      laps: 0,
    });
  });

  it('without heart rate or power has no load or kcal to show', () => {
    const s = buildRideSummary({ id: 'r', dateMs: 0, route, ride, mode: 'wheel', weightKg: 70 });
    expect(hasLoad(s)).toBe(false);
    expect(hasKcal(s)).toBe(false);
  });

  it('with power has kcal (≈ kJ) but still no load without heart rate', () => {
    const s = buildRideSummary({
      id: 'r',
      dateMs: 0,
      route,
      ride,
      mode: 'power',
      weightKg: 70,
      powerSamples: Array.from({ length: 120 }, () => 200),
      ftpW: 200,
    });
    expect(hasLoad(s)).toBe(false);
    expect(hasKcal(s)).toBe(true);
    expect(s.kcalEstimated).toBeCloseTo(24, 9);
  });

  it('with a minute of heart rate gets load from it', () => {
    const zones: HrZone[] = [
      { id: 'L1', label: 'L1', min: 20, max: 21 },
      { id: 'L2', label: 'L2', min: 22, max: 23 },
      { id: 'L3', label: 'L3', min: 24, max: 25 },
      { id: 'UA', label: 'UA', min: 26, max: 27 },
      { id: 'UA+', label: 'UA+', min: 28, max: 28 },
      { id: 'VO2', label: 'VO2', min: 29, max: null },
    ];
    const hr = addHrSample(emptyHrTime(), 150, 120, zones); // 2′ in L3
    const s = buildRideSummary({
      id: 'r',
      dateMs: 0,
      route,
      ride,
      mode: 'power',
      weightKg: 70,
      hr,
    });
    expect(hasLoad(s)).toBe(true);
    expect(s.load).toBeCloseTo(6, 9); // 2′ × 3
  });

  it('workout sessions always have load (from blocks)', () => {
    const steps = expandWorkout([makeBlock(600, 'L2')]);
    const p = tick(togglePlay(createPlayer(steps)).state, 600).state;
    const s = buildSessionSummary({
      id: 'x',
      dateMs: 0,
      workoutName: 'W',
      player: p,
      weightKg: 70,
    });
    expect(hasLoad(s)).toBe(true);
  });
});

describe('workout on a route', () => {
  const route = { id: 'ej-embalse', name: 'Embalse', distanceM: 2000 };

  it('counts full laps: 9 km in 20′ on a 2 km route = 4 laps at 27 km/h; 4.5 km = 2', () => {
    const ride = rideSummaryOf(route, { distanceM: 9000, ascentM: 30, elapsedSec: 1200 }, 'power');
    expect(ride).toMatchObject({ laps: 4, avgSpeedKmh: 27, distanceM: 9000, mode: 'power' });
    expect(rideSummaryOf(route, { distanceM: 4500, ascentM: 0, elapsedSec: 1 }, 'wheel').laps).toBe(
      2,
    );
    // Exactly at the end of a lap counts it, despite floating point
    expect(
      rideSummaryOf(route, { distanceM: 3999.9999999999, ascentM: 0, elapsedSec: 1 }, 'wheel').laps,
    ).toBe(2);
  });

  it('keeps the workout summary and adds the route', () => {
    const steps = expandWorkout([makeBlock(600, 'L2')]);
    const p = tick(togglePlay(createPlayer(steps)).state, 600).state;
    const ride = rideSummaryOf(route, { distanceM: 5000, ascentM: 10, elapsedSec: 600 }, 'power');
    const s = buildSessionSummary({
      id: 'x',
      dateMs: 0,
      workoutName: 'Fondo',
      player: p,
      weightKg: 70,
      ride,
    });
    expect(s.workoutName).toBe('Fondo');
    expect(s.ride).toEqual(ride);
    expect(s.load).toBeCloseTo(20, 9); // 10′ in L2 × 2, from the blocks
  });
});
