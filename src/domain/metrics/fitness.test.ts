import { describe, expect, it } from 'vitest';
import type { HrMeasured } from './summary';
import {
  countsForFitness,
  fitnessCurve,
  freshnessLevel,
  weekDays,
  weekStart,
  weeklyTotals,
} from './fitness';

const at = (y: number, m: number, d: number, h = 18) => new Date(y, m - 1, d, h).getTime();
const sim = { simulated: true } as HrMeasured;

describe('fitness curve', () => {
  it('matches a hand-worked day and the day after', () => {
    // One session of load 100, from nothing:
    // condition = 100/42 = 2.381, fatigue = 100/7 = 14.286, freshness = −11.905.
    // Next day: 2.381·41/42 = 2.324 and 14.286·6/7 = 12.245.
    const curve = fitnessCurve([{ dateMs: at(2026, 11, 2), load: 100 }], at(2026, 11, 3), 2);
    expect(curve).toHaveLength(2);
    const [d0, d1] = curve;
    expect(d0?.condition).toBeCloseTo(2.381, 3);
    expect(d0?.fatigue).toBeCloseTo(14.286, 3);
    expect(d0?.freshness).toBeCloseTo(-11.905, 3);
    expect(d1?.condition).toBeCloseTo(2.324, 3);
    expect(d1?.fatigue).toBeCloseTo(12.245, 3);
  });

  it('adds up two sessions on the same day and spans the requested days', () => {
    const curve = fitnessCurve(
      [
        { dateMs: at(2026, 11, 20, 8), load: 60 },
        { dateMs: at(2026, 11, 20, 19), load: 40 },
      ],
      at(2026, 11, 26),
      90,
    );
    expect(curve).toHaveLength(90);
    expect(curve.find((d) => d.load > 0)?.load).toBe(100);
    expect(curve.at(-1)?.dayMs).toBe(new Date(2026, 10, 26).getTime());
  });

  it('a steady load converges: condition and fatigue meet, freshness → 0', () => {
    const sessions = Array.from({ length: 400 }, (_, i) => ({
      dateMs: new Date(2025, 0, 1 + i, 18).getTime(),
      load: 80,
    }));
    const last = fitnessCurve(sessions, sessions.at(-1)?.dateMs ?? 0, 1)[0];
    expect(last?.condition).toBeCloseTo(80, 0);
    expect(last?.fatigue).toBeCloseTo(80, 3);
    expect(Math.abs(last?.freshness ?? 99)).toBeLessThan(0.5);
  });

  it('leaves out sessions with simulated sensors', () => {
    expect(countsForFitness({ hrMeasured: sim })).toBe(false);
    expect(countsForFitness({})).toBe(true);
    const curve = fitnessCurve(
      [{ dateMs: at(2026, 11, 2), load: 100, hrMeasured: sim }],
      at(2026, 11, 3),
      2,
    );
    expect(curve.every((d) => d.load === 0)).toBe(true);
  });
});

describe('weeks', () => {
  it('starts weeks on Monday', () => {
    // 26 Nov 2026 is a Thursday; its Monday is the 23rd.
    expect(weekStart(at(2026, 11, 26))).toBe(new Date(2026, 10, 23).getTime());
    expect(weekStart(at(2026, 11, 23, 0))).toBe(new Date(2026, 10, 23).getTime());
  });

  it('totals the last weeks, oldest first', () => {
    const weeks = weeklyTotals(
      [
        { dateMs: at(2026, 11, 24), load: 50, durationSec: 3600 },
        { dateMs: at(2026, 11, 26), load: 30, durationSec: 1800 },
        { dateMs: at(2026, 11, 17), load: 70, durationSec: 4000 },
        { dateMs: at(2025, 1, 1), load: 999, durationSec: 1 },
      ],
      at(2026, 11, 26),
      3,
    );
    expect(weeks.map((w) => w.load)).toEqual([0, 70, 80]);
    expect(weeks[2]).toMatchObject({ durationSec: 5400, sessions: 2 });
  });

  it('reads freshness in bands', () => {
    expect(freshnessLevel(15)).toBe('fresh');
    expect(freshnessLevel(0)).toBe('balanced');
    expect(freshnessLevel(-40)).toBe('loaded');
    expect(freshnessLevel(-80)).toBe('overloaded');
  });
});

describe('current week', () => {
  it('lists Monday to Sunday with what was ridden each day', () => {
    // Thursday 26 Nov 2026: week of Mon 23 to Sun 29.
    const days = weekDays(
      [
        { dateMs: at(2026, 11, 23, 8), load: 40, durationSec: 1800 },
        { dateMs: at(2026, 11, 23, 19), load: 20, durationSec: 900 },
        { dateMs: at(2026, 11, 25), load: 90, durationSec: 3600 },
        { dateMs: at(2026, 11, 26), load: 500, durationSec: 60, hrMeasured: sim },
        { dateMs: at(2026, 11, 22), load: 70, durationSec: 4000 },
      ],
      at(2026, 11, 26),
    );
    expect(days).toHaveLength(7);
    expect(days[0]?.dayMs).toBe(new Date(2026, 10, 23).getTime());
    expect(days[6]?.dayMs).toBe(new Date(2026, 10, 29).getTime());
    // Monday: 40 + 20 load, 30 + 15 min, two sessions. Sunday 22 is last week.
    expect(days.map((d) => d.load)).toEqual([60, 0, 90, 0, 0, 0, 0]);
    expect(days[0]).toMatchObject({ durationSec: 2700, sessions: 2 });
  });
});
