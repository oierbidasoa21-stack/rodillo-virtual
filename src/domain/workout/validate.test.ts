import { describe, expect, it } from 'vitest';
import { makeBlock, makeRepeat } from './types';
import { validateWorkout } from './validate';

describe('validateWorkout', () => {
  it('accepts a named workout of at least one minute', () => {
    expect(validateWorkout({ name: 'Corta', blocks: [makeBlock(60, 'L1')] })).toEqual([]);
  });

  it('counts repeats towards the minimum duration', () => {
    const blocks = [makeRepeat(2, [makeBlock(30, 'L1')])];
    expect(validateWorkout({ name: 'Rep', blocks })).toEqual([]);
  });

  it('requires a non-blank name', () => {
    expect(validateWorkout({ name: '   ', blocks: [makeBlock(60, 'L1')] })).toEqual([
      'Ponle un nombre a la sesión para poder guardarla.',
    ]);
  });

  it('rejects workouts under a minute', () => {
    expect(validateWorkout({ name: 'X', blocks: [makeBlock(59, 'L1')] })).toHaveLength(1);
    expect(validateWorkout({ name: '', blocks: [] })).toHaveLength(2);
  });
});
