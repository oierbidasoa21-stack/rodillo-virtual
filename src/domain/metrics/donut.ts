import { ZONE_IDS, type ZoneId } from '../zones/zones';
import type { SecByZone } from './timeInZone';

export interface DonutSegment {
  id: ZoneId;
  sec: number;
  /** Share of the total, 0–1. */
  share: number;
  /** Where the segment starts around the ring, as a share of a full turn. */
  start: number;
}

/**
 * Segments of a ring chart of the time in each zone, in zone order, leaving
 * out zones with no time. Empty when there is no time at all.
 */
export function donutSegments(secByZone: SecByZone): DonutSegment[] {
  const total = ZONE_IDS.reduce((sum, id) => sum + Math.max(0, secByZone[id]), 0);
  if (total <= 0) return [];
  const out: DonutSegment[] = [];
  let start = 0;
  for (const id of ZONE_IDS) {
    const sec = Math.max(0, secByZone[id]);
    if (sec <= 0) continue;
    const share = sec / total;
    out.push({ id, sec, share, start });
    start += share;
  }
  return out;
}
