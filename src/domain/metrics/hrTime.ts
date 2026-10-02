import { type HrZone, classifyPer10s } from '../zones/zones';
import { type SecByZone, emptySecByZone } from './timeInZone';

/** Below this much measured heart rate, the summary falls back to the blocks (as in v1). */
export const MIN_MEASURED_SEC = 60;
/** Load points per minute and MET for time below the first zone (as in v1). */
export const BELOW_ZONES_LOAD_WEIGHT = 0.5;
export const BELOW_ZONES_MET = 3.5;

/** Heart rate measured during a session, accumulated tick by tick. */
export interface HrTime {
  secByZone: SecByZone;
  /** Time below the first zone. */
  belowSec: number;
  /** Time with a fresh heart rate reading. */
  coveredSec: number;
  /** ∫ bpm dt, for the average. */
  bpmSec: number;
  maxBpm: number;
}

export function emptyHrTime(): HrTime {
  return { secByZone: emptySecByZone(), belowSec: 0, coveredSec: 0, bpmSec: 0, maxBpm: 0 };
}

/**
 * Adds `dtSec` at `bpm` (null = no fresh reading, nothing is counted). The zone
 * comes from ppm/6 rounded, the same way a hand count is classified.
 */
export function addHrSample(
  acc: HrTime,
  bpm: number | null,
  dtSec: number,
  zones: readonly HrZone[],
): HrTime {
  if (bpm === null || !(dtSec > 0)) return acc;
  const zone = classifyPer10s(Math.round(bpm / 6), zones);
  return {
    secByZone: zone
      ? { ...acc.secByZone, [zone.id]: acc.secByZone[zone.id] + dtSec }
      : acc.secByZone,
    belowSec: zone ? acc.belowSec : acc.belowSec + dtSec,
    coveredSec: acc.coveredSec + dtSec,
    bpmSec: acc.bpmSec + bpm * dtSec,
    maxBpm: Math.max(acc.maxBpm, bpm),
  };
}

/** Time-weighted average heart rate, or null with no readings. */
export function averageBpm(acc: HrTime): number | null {
  return acc.coveredSec > 0 ? acc.bpmSec / acc.coveredSec : null;
}
