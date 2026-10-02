import { isZoneId } from '../zones/zones';
import { BLOCK_KINDS, type Block, type BlockKind, type Workout, type WorkoutItem } from './types';

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * Brings a stored block to the current model. Before phase 4 a block had
 * `zoneId` instead of `target`. Returns null for anything unrecognisable.
 */
function migrateBlock(raw: unknown): Block | null {
  if (!isRecord(raw) || raw.type !== 'block' || typeof raw.durationSec !== 'number') return null;
  const kind: BlockKind = BLOCK_KINDS.find((k) => k === raw.kind) ?? 'steady';
  const note = typeof raw.note === 'string' ? raw.note : '';
  const base = { type: 'block' as const, durationSec: raw.durationSec, kind, note };

  const t = raw.target;
  if (isRecord(t)) {
    if (t.type === 'hr' && isZoneId(t.zoneId))
      return { ...base, target: { type: 'hr', zoneId: t.zoneId } };
    if (t.type === 'power' && typeof t.pctFtp === 'number')
      return { ...base, target: { type: 'power', pctFtp: t.pctFtp } };
    if (t.type === 'watts' && typeof t.watts === 'number')
      return { ...base, target: { type: 'watts', watts: t.watts } };
  }
  if (isZoneId(raw.zoneId)) return { ...base, target: { type: 'hr', zoneId: raw.zoneId } };
  return null;
}

function migrateItem(raw: unknown): WorkoutItem | null {
  if (isRecord(raw) && raw.type === 'repeat' && Array.isArray(raw.items)) {
    const items = raw.items.map(migrateBlock).filter((b): b is Block => b !== null);
    const times = typeof raw.times === 'number' && raw.times >= 1 ? Math.round(raw.times) : 1;
    return { type: 'repeat', times, items };
  }
  return migrateBlock(raw);
}

/** Normalises a stored workout (any version) to the current model. */
export function migrateWorkout(raw: unknown): Workout | null {
  if (!isRecord(raw) || typeof raw.id !== 'string' || !Array.isArray(raw.blocks)) return null;
  return {
    id: raw.id,
    name: typeof raw.name === 'string' ? raw.name : '',
    description: typeof raw.description === 'string' ? raw.description : '',
    blocks: raw.blocks.map(migrateItem).filter((i): i is WorkoutItem => i !== null),
  };
}
