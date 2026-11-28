import { describe, expect, it } from 'vitest';
import { migrateWorkout } from './migrate';
import { makeBlock, makeRepeat } from './types';

describe('migrateWorkout', () => {
  it('turns pre-phase-4 zoneId blocks into hr targets, inside repeats too', () => {
    const v1 = {
      id: 'c-1',
      name: 'Antigua',
      description: 'v1',
      blocks: [
        { type: 'block', durationSec: 600, zoneId: 'L1', kind: 'warm', note: '' },
        {
          type: 'repeat',
          times: 3,
          items: [
            { type: 'block', durationSec: 600, zoneId: 'UA', kind: 'work', note: 'fuerte' },
            { type: 'block', durationSec: 240, zoneId: 'L1', kind: 'rec', note: '' },
          ],
        },
      ],
    };
    expect(migrateWorkout(v1)).toEqual({
      id: 'c-1',
      name: 'Antigua',
      description: 'v1',
      blocks: [
        makeBlock(600, 'Z1', 'warm'),
        makeRepeat(3, [makeBlock(600, 'Z4', 'work', 'fuerte'), makeBlock(240, 'Z1', 'rec')]),
      ],
    });
  });

  it('keeps current-model blocks as they are', () => {
    const current = {
      id: 'c-2',
      name: 'Nueva',
      description: '',
      blocks: [
        makeBlock(300, 'Z2'),
        makeBlock(600, { type: 'power', pctFtp: 88 }, 'work'),
        makeBlock(60, { type: 'watts', watts: 200 }, 'work'),
      ],
    };
    expect(migrateWorkout(current)).toEqual(current);
  });

  it('drops unrecognisable blocks and repairs missing fields', () => {
    const messy = {
      id: 'c-3',
      blocks: [
        { type: 'block', durationSec: 60, zoneId: 'Z9' },
        { type: 'block', durationSec: 60, zoneId: 'L3', kind: 'nope' },
        'junk',
      ],
    };
    expect(migrateWorkout(messy)).toEqual({
      id: 'c-3',
      name: '',
      description: '',
      blocks: [makeBlock(60, 'Z3', 'steady')],
    });
  });

  it('rejects things that are not workouts', () => {
    expect(migrateWorkout(null)).toBeNull();
    expect(migrateWorkout({ id: 1, blocks: [] })).toBeNull();
  });
});

describe('heart rate ceilings (phase 15a)', () => {
  it('keeps the session and block ceilings, and a workout without them stays as it was', () => {
    const w = migrateWorkout({
      id: 'w',
      name: 'Umbral',
      description: '',
      maxHr: { type: 'bpm', bpm: 165 },
      blocks: [
        {
          type: 'block',
          durationSec: 600,
          target: { type: 'hr', zoneId: 'Z4' },
          kind: 'work',
          note: '',
          maxHr: { type: 'zone', zoneId: 'UA+' },
        },
        {
          type: 'block',
          durationSec: 300,
          target: { type: 'hr', zoneId: 'Z1' },
          kind: 'rec',
          note: '',
          maxHr: { type: 'bpm', bpm: 5 },
        },
      ],
    });
    expect(w?.maxHr).toEqual({ type: 'bpm', bpm: 165 });
    expect(w?.blocks[0]).toMatchObject({ maxHr: { type: 'zone', zoneId: 'Z5' } });
    // An impossible value is dropped, not kept.
    expect(w?.blocks[1]).not.toHaveProperty('maxHr');
    const old = migrateWorkout({ id: 'o', name: 'Fondo', description: '', blocks: [] });
    expect(old).not.toHaveProperty('maxHr');
  });
});
