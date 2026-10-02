import { describe, expect, it } from 'vitest';
import { expandWorkout } from '../workout/expand';
import { createPlayer, skip, tick, togglePlay } from '../workout/player';
import { makeBlock } from '../workout/types';
import { type SessionSummary, buildSessionSummary, recentTotals } from './summary';
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
