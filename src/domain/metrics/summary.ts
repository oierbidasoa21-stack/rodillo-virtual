import { type HrCount, type PlayerState, actualDurationSec } from '../workout/player';
import {
  BELOW_ZONES_LOAD_WEIGHT,
  BELOW_ZONES_MET,
  type HrTime,
  MIN_MEASURED_SEC,
  averageBpm,
} from './hrTime';
import { kcalByMet } from './kcal';
import { zoneLoad } from './load';
import { type SecByZone, actualSecByZone, plannedSecByZone } from './timeInZone';

/** Sessions shorter than this are not saved to the history. */
export const MIN_SAVED_SESSION_SEC = 60;

/** Time in zone measured by a heart rate sensor. */
export interface HrMeasured {
  secByZone: SecByZone;
  belowSec: number;
  coveredSec: number;
  avgBpm: number;
  maxBpm: number;
  /** Came from the simulated sensor, not a real strap. */
  simulated: boolean;
}

/** A finished session, as stored in the history. */
export interface SessionSummary {
  id: string;
  dateMs: number;
  workoutName: string;
  durationSec: number;
  /** Zone load: from the heart rate sensor when measured, else from the blocks ridden. */
  load: number;
  /** MET-based estimate, ±20 %. */
  kcalEstimated: number;
  plannedSecByZone: SecByZone;
  actualSecByZone: SecByZone;
  counts: HrCount[];
  /** Present when there were at least 60 s of heart rate readings. Older entries lack it. */
  hrMeasured?: HrMeasured;
}

export function buildSessionSummary(args: {
  id: string;
  dateMs: number;
  workoutName: string;
  player: PlayerState;
  weightKg: number;
  hr?: HrTime;
  hrSimulated?: boolean;
}): SessionSummary {
  const { player, hr, weightKg } = args;
  const actual = actualSecByZone(player.steps, player.actualSecByStep);
  const base = {
    id: args.id,
    dateMs: args.dateMs,
    workoutName: args.workoutName,
    durationSec: actualDurationSec(player),
    plannedSecByZone: plannedSecByZone(player.steps),
    actualSecByZone: actual,
    counts: player.counts,
  };

  if (hr && hr.coveredSec >= MIN_MEASURED_SEC) {
    return {
      ...base,
      load: zoneLoad(hr.secByZone) + (hr.belowSec / 60) * BELOW_ZONES_LOAD_WEIGHT,
      kcalEstimated:
        kcalByMet(hr.secByZone, weightKg) + BELOW_ZONES_MET * weightKg * (hr.belowSec / 3600),
      hrMeasured: {
        secByZone: hr.secByZone,
        belowSec: hr.belowSec,
        coveredSec: hr.coveredSec,
        avgBpm: averageBpm(hr) ?? 0,
        maxBpm: hr.maxBpm,
        simulated: args.hrSimulated ?? false,
      },
    };
  }
  return { ...base, load: zoneLoad(actual), kcalEstimated: kcalByMet(actual, weightKg) };
}

/** Totals over the sessions of the last `days` days before `nowMs`. */
export function recentTotals(
  sessions: readonly SessionSummary[],
  nowMs: number,
  days = 7,
): { count: number; durationSec: number; load: number } {
  const recent = sessions.filter((s) => nowMs - s.dateMs < days * 86_400_000);
  return {
    count: recent.length,
    durationSec: recent.reduce((sum, s) => sum + s.durationSec, 0),
    load: recent.reduce((sum, s) => sum + s.load, 0),
  };
}
