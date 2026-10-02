import { type ZoneId, isZoneId } from '../zones/zones';

export const BLOCK_KINDS = ['warm', 'work', 'rec', 'cool', 'steady'] as const;
export type BlockKind = (typeof BLOCK_KINDS)[number];

export const BLOCK_KIND_LABELS: Readonly<Record<BlockKind, string>> = {
  warm: 'Calentamiento',
  work: 'Serie',
  rec: 'Recuperación',
  cool: 'Vuelta a la calma',
  steady: 'Bloque',
};

/**
 * What a block asks for: a heart rate zone, a % of FTP, or fixed watts.
 * Fixed watts are only used internally (ramp test); the editor offers hr and power.
 */
export type BlockTarget =
  | { type: 'hr'; zoneId: ZoneId }
  | { type: 'power'; pctFtp: number }
  | { type: 'watts'; watts: number };

export interface Block {
  type: 'block';
  durationSec: number;
  target: BlockTarget;
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

/** A heart rate zone id is shorthand for an hr target. */
export function makeBlock(
  durationSec: number,
  target: ZoneId | BlockTarget,
  kind: BlockKind = 'steady',
  note = '',
): Block {
  return {
    type: 'block',
    durationSec,
    target: isZoneId(target) ? { type: 'hr', zoneId: target } : target,
    kind,
    note,
  };
}

export function makeRepeat(times: number, items: Block[]): Repeat {
  return { type: 'repeat', times, items };
}

/** The heart rate zone a block targets, or null for power blocks. */
export function hrZoneOf(block: Pick<Block, 'target'>): ZoneId | null {
  return block.target.type === 'hr' ? block.target.zoneId : null;
}
