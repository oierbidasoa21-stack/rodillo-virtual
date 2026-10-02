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
        makeBlock(600, 'L1', 'warm'),
        makeRepeat(3, [makeBlock(600, 'UA', 'work', 'fuerte'), makeBlock(240, 'L1', 'rec')]),
      ],
    });
  });

  it('keeps current-model blocks as they are', () => {
    const current = {
      id: 'c-2',
      name: 'Nueva',
      description: '',
      blocks: [
        makeBlock(300, 'L2'),
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
      blocks: [makeBlock(60, 'L3', 'steady')],
    });
  });

  it('rejects things that are not workouts', () => {
    expect(migrateWorkout(null)).toBeNull();
    expect(migrateWorkout({ id: 1, blocks: [] })).toBeNull();
  });
});
