import type { ZoneId } from '../zones/zones';

export const BLOCK_KINDS = ['warm', 'work', 'rec', 'cool', 'steady'] as const;
export type BlockKind = (typeof BLOCK_KINDS)[number];

export const BLOCK_KIND_LABELS: Readonly<Record<BlockKind, string>> = {
  warm: 'Calentamiento',
  work: 'Serie',
  rec: 'Recuperación',
  cool: 'Vuelta a la calma',
  steady: 'Bloque',
};

export interface Block {
  type: 'block';
  durationSec: number;
  zoneId: ZoneId;
  kind: BlockKind;
  note: string;
}

/** Repeats its blocks `times` times. One level only: no nested repeats. */
export interface Repeat {
  type: 'repeat';
  times: number;
  items: Block[];
}

export type WorkoutItem = Block | Repeat;

export interface Workout {
  id: string;
  name: string;
  description: string;
  blocks: WorkoutItem[];
}

/** A block in the flat, playable list, with its position inside a repeat. */
export interface Step extends Block {
  repeat?: { index: number; times: number };
}

export function makeBlock(
  durationSec: number,
  zoneId: ZoneId,
  kind: BlockKind = 'steady',
  note = '',
): Block {
  return { type: 'block', durationSec, zoneId, kind, note };
}

export function makeRepeat(times: number, items: Block[]): Repeat {
  return { type: 'repeat', times, items };
}
