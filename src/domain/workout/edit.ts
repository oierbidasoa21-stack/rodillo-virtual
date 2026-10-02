import type { Block, WorkoutItem } from './types';

/** `[i]` is a top-level item; `[i, j]` is block `j` inside the repeat at `i`. */
export type ItemPath = readonly [number] | readonly [number, number];

// Immutable editor operations. Invalid paths leave the list unchanged.

export function appendItem(blocks: readonly WorkoutItem[], item: WorkoutItem): WorkoutItem[] {
  return [...blocks, item];
}

export function appendToRepeat(
  blocks: readonly WorkoutItem[],
  repeatIndex: number,
  block: Block,
): WorkoutItem[] {
  return blocks.map((item, i) =>
    i === repeatIndex && item.type === 'repeat' ? { ...item, items: [...item.items, block] } : item,
  );
}

/** Applies `fn` to the array that holds `path` (top level or a repeat's items). */
function withParent(
  blocks: readonly WorkoutItem[],
  path: ItemPath,
  fn: <T extends WorkoutItem>(arr: readonly T[], index: number) => T[],
): WorkoutItem[] {
  const [i, j] = path;
  if (j === undefined) return fn(blocks, i);
  return blocks.map((item, k) =>
    k === i && item.type === 'repeat' ? { ...item, items: fn(item.items, j) } : item,
  );
}

export function moveItem(
  blocks: readonly WorkoutItem[],
  path: ItemPath,
  delta: -1 | 1,
): WorkoutItem[] {
  return withParent(blocks, path, (arr, index) => {
    const target = index + delta;
    const a = arr[index];
    const b = arr[target];
    if (a === undefined || b === undefined) return [...arr];
    const next = [...arr];
    next[index] = b;
    next[target] = a;
    return next;
  });
}

export function removeItem(blocks: readonly WorkoutItem[], path: ItemPath): WorkoutItem[] {
  return withParent(blocks, path, (arr, index) => arr.filter((_, k) => k !== index));
}

export function updateBlock(
  blocks: readonly WorkoutItem[],
  path: ItemPath,
  patch: Partial<Omit<Block, 'type'>>,
): WorkoutItem[] {
  return withParent(blocks, path, (arr, index) =>
    arr.map((item, k) => (k === index && item.type === 'block' ? { ...item, ...patch } : item)),
  );
}

export function setRepeatTimes(
  blocks: readonly WorkoutItem[],
  repeatIndex: number,
  times: number,
): WorkoutItem[] {
  const safe = Math.max(1, Math.round(Number.isFinite(times) ? times : 1));
  return blocks.map((item, i) =>
    i === repeatIndex && item.type === 'repeat' ? { ...item, times: safe } : item,
  );
}

/** Splits seconds into whole minutes and remaining seconds, for the editor inputs. */
export function splitDuration(durationSec: number): { min: number; sec: number } {
  return { min: Math.floor(durationSec / 60), sec: durationSec % 60 };
}

/** Joins editor inputs back into seconds. Negative or invalid input becomes 0; seconds cap at 59. */
export function joinDuration(min: number, sec: number): number {
  const m = Math.max(0, Math.floor(Number.isFinite(min) ? min : 0));
  const s = Math.min(59, Math.max(0, Math.floor(Number.isFinite(sec) ? sec : 0)));
  return m * 60 + s;
}
