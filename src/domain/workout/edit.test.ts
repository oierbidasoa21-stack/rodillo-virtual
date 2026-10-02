import { describe, expect, it } from 'vitest';
import {
  appendItem,
  appendToRepeat,
  joinDuration,
  moveItem,
  removeItem,
  setRepeatTimes,
  splitDuration,
  updateBlock,
} from './edit';
import { type WorkoutItem, makeBlock, makeRepeat } from './types';

const a = makeBlock(60, 'L1');
const b = makeBlock(120, 'L2');
const x = makeBlock(30, 'UA', 'work');
const y = makeBlock(30, 'L1', 'rec');
const blocks: WorkoutItem[] = [a, makeRepeat(3, [x, y]), b];

describe('editor operations', () => {
  it('appends items and blocks inside a repeat', () => {
    expect(appendItem(blocks, b)).toHaveLength(4);
    const next = appendToRepeat(blocks, 1, a);
    expect(next[1]?.type === 'repeat' && next[1].items).toEqual([x, y, a]);
    expect(appendToRepeat(blocks, 0, a)).toEqual(blocks); // not a repeat
  });

  it('moves top-level items and blocks within a repeat', () => {
    expect(moveItem(blocks, [0], 1).map((i) => i.type)).toEqual(['repeat', 'block', 'block']);
    const inner = moveItem(blocks, [1, 1], -1);
    expect(inner[1]?.type === 'repeat' && inner[1].items).toEqual([y, x]);
  });

  it('ignores moves past either end', () => {
    expect(moveItem(blocks, [0], -1)).toEqual(blocks);
    expect(moveItem(blocks, [1, 1], 1)).toEqual(blocks);
  });

  it('removes items by path', () => {
    expect(removeItem(blocks, [1])).toEqual([a, b]);
    const inner = removeItem(blocks, [1, 0]);
    expect(inner[1]?.type === 'repeat' && inner[1].items).toEqual([y]);
  });

  it('updates a block without touching the source', () => {
    const next = updateBlock(blocks, [1, 0], { zoneId: 'VO2', note: 'fuerte' });
    expect(next[1]?.type === 'repeat' && next[1].items[0]).toMatchObject({
      zoneId: 'VO2',
      note: 'fuerte',
    });
    expect(x.zoneId).toBe('UA');
  });

  it('clamps repeat times to a positive integer', () => {
    const times = (n: number) => {
      const r = setRepeatTimes(blocks, 1, n)[1];
      return r?.type === 'repeat' ? r.times : null;
    };
    expect(times(4.6)).toBe(5);
    expect(times(0)).toBe(1);
    expect(times(NaN)).toBe(1);
  });
});

describe('duration inputs', () => {
  it('splits and joins minutes and seconds', () => {
    expect(splitDuration(754)).toEqual({ min: 12, sec: 34 });
    expect(joinDuration(12, 34)).toBe(754);
  });

  it('sanitises invalid input', () => {
    expect(joinDuration(-3, 75)).toBe(59);
    expect(joinDuration(NaN, NaN)).toBe(0);
  });
});
