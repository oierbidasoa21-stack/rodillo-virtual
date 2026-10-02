import { describe, expect, it } from 'vitest';
import { expandWorkout, totalDurationSec } from './expand';
import { BUILTIN_WORKOUTS } from './library';
import { makeBlock, makeRepeat } from './types';

describe('expandWorkout', () => {
  it('unrolls repeats in order and tags each step with its repetition', () => {
    const steps = expandWorkout([
      makeBlock(300, 'L1', 'warm'),
      makeRepeat(2, [makeBlock(60, 'UA', 'work'), makeBlock(30, 'L1', 'rec')]),
    ]);
    expect(
      steps.map((s) => `${s.zoneId}:${s.repeat ? `${s.repeat.index}/${s.repeat.times}` : '-'}`),
    ).toEqual(['L1:-', 'UA:1/2', 'L1:1/2', 'UA:2/2', 'L1:2/2']);
  });

  it('drops zero-length blocks', () => {
    expect(expandWorkout([makeBlock(0, 'L1'), makeBlock(60, 'L2')])).toHaveLength(1);
  });

  it('does not share block objects with the source', () => {
    const block = makeBlock(60, 'L2');
    const [step] = expandWorkout([block]);
    expect(step).not.toBe(block);
  });
});

describe('built-in library', () => {
  // Durations worked out by hand from the block lists, in minutes.
  const expectedMin: Record<string, number> = {
    'b-fondo': 10 + 55 + 5, // 70
    'b-tempo': 15 + 3 * (12 + 4) + 8, // 71
    'b-ua3x10': 15 + 3 * (10 + 4) + 10, // 67
    'b-ua2x20': 15 + 2 * (20 + 5) + 10, // 75
    'b-overunder': 15 + 3 * (4 + 1 + 4 + 1 + 5) + 8, // 68
    'b-vo2x5': 15 + 2 + 3 + 5 * (3 + 3) + 10, // 60
    'b-3030': 15 + 10 * 1 + 6 + 10 * 1 + 10, // 51
    'b-piramide': 15 + (4 + 2 + 4 + 2 + 3 + 2 + 2 + 2 + 3 + 2 + 4 + 2 + 4) + 8, // 59
  };

  it('has the 8 sessions from v1 with unique ids', () => {
    expect(BUILTIN_WORKOUTS.map((w) => w.id).sort()).toEqual(Object.keys(expectedMin).sort());
  });

  it.each(BUILTIN_WORKOUTS.map((w) => [w.id, w] as const))('%s lasts as planned', (id, w) => {
    expect(totalDurationSec(expandWorkout(w.blocks))).toBe((expectedMin[id] ?? NaN) * 60);
  });

  it('Umbral 3×10′ is 67′ = 4020 s', () => {
    const w = BUILTIN_WORKOUTS.find((x) => x.id === 'b-ua3x10');
    expect(totalDurationSec(expandWorkout(w?.blocks ?? []))).toBe(4020);
  });

  it('30/30 blocks are exactly 30 s', () => {
    const w = BUILTIN_WORKOUTS.find((x) => x.id === 'b-3030');
    const vo2 = expandWorkout(w?.blocks ?? []).filter((s) => s.zoneId === 'VO2');
    expect(vo2).toHaveLength(20);
    expect(vo2.every((s) => s.durationSec === 30)).toBe(true);
  });
});
