import { type HrCount, type PlayerState, actualDurationSec } from '../workout/player';
import { kcalByMet } from './kcal';
import { zoneLoad } from './load';
import { type SecByZone, actualSecByZone, plannedSecByZone } from './timeInZone';

/** Sessions shorter than this are not saved to the history. */
export const MIN_SAVED_SESSION_SEC = 60;

/** A finished session, as stored in the history. */
export interface SessionSummary {
  id: string;
  dateMs: number;
  workoutName: string;
  durationSec: number;
  /** Zone load based on the blocks ridden (no heart rate sensor yet). */
  load: number;
  /** MET-based estimate, ±20 %. */
  kcalEstimated: number;
  plannedSecByZone: SecByZone;
  actualSecByZone: SecByZone;
  counts: HrCount[];
}

export function buildSessionSummary(args: {
  id: string;
  dateMs: number;
  workoutName: string;
  player: PlayerState;
  weightKg: number;
}): SessionSummary {
  const { player } = args;
  const actual = actualSecByZone(player.steps, player.actualSecByStep);
  return {
    id: args.id,
    dateMs: args.dateMs,
    workoutName: args.workoutName,
    durationSec: actualDurationSec(player),
    load: zoneLoad(actual),
    kcalEstimated: kcalByMet(actual, args.weightKg),
    plannedSecByZone: plannedSecByZone(player.steps),
    actualSecByZone: actual,
    counts: player.counts,
  };
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
