import { type HrCount, type PlayerState, actualDurationSec } from '../workout/player';
import {
  BELOW_ZONES_LOAD_WEIGHT,
  BELOW_ZONES_MET,
  type HrTime,
  MIN_MEASURED_SEC,
  averageBpm,
} from './hrTime';
import { POWER_ZONE_IDS, type PowerZoneId, powerZoneOfWatts } from '../zones/powerZones';
import { kcalByMet } from './kcal';
import { zoneLoad } from './load';
import {
  averagePowerW,
  kilojoules,
  maxPowerW,
  normalizedPowerW,
  intensityFactor,
  trainingStressScore,
} from './power';
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

/** Below this much estimated power the summary shows no power metrics. */
export const MIN_POWER_SEC = 60;

export type SecByPowerZone = Record<PowerZoneId, number>;

/** Power metrics of a session. Always estimated (trainer curve), never measured. */
export interface PowerSummary {
  avgW: number;
  maxW: number;
  /** Null under 30 s of power. */
  npW: number | null;
  /** IF and TSS need an FTP at the time of the session. */
  ifactor: number | null;
  tss: number | null;
  kJ: number;
  /** Seconds with a power reading. */
  coveredSec: number;
  /** Null without an FTP. */
  secByPowerZone: SecByPowerZone | null;
  estimated: true;
  simulated: boolean;
}

function summarisePower(
  samples: readonly number[],
  ftpW: number | null,
  simulated: boolean,
): PowerSummary | undefined {
  if (samples.length < MIN_POWER_SEC) return undefined;
  const npW = normalizedPowerW(samples);
  let secByPowerZone: SecByPowerZone | null = null;
  if (ftpW !== null) {
    const zones = Object.fromEntries(POWER_ZONE_IDS.map((id) => [id, 0])) as SecByPowerZone;
    for (const w of samples) zones[powerZoneOfWatts(w, ftpW)] += 1;
    secByPowerZone = zones;
  }
  return {
    avgW: averagePowerW(samples) ?? 0,
    maxW: maxPowerW(samples) ?? 0,
    npW,
    ifactor: npW !== null && ftpW !== null ? intensityFactor(npW, ftpW) : null,
    tss: npW !== null && ftpW !== null ? trainingStressScore(samples.length, npW, ftpW) : null,
    kJ: kilojoules(samples),
    coveredSec: samples.length,
    secByPowerZone,
    estimated: true,
    simulated,
  };
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
  /** Present with at least 60 s of estimated power. With it, kcal ≈ kJ. */
  power?: PowerSummary;
}

export function buildSessionSummary(args: {
  id: string;
  dateMs: number;
  workoutName: string;
  player: PlayerState;
  weightKg: number;
  hr?: HrTime;
  hrSimulated?: boolean;
  /** Estimated power, one sample per second. */
  powerSamples?: readonly number[];
  powerSimulated?: boolean;
  ftpW?: number | null;
}): SessionSummary {
  const { player, hr, weightKg } = args;
  const power = summarisePower(
    args.powerSamples ?? [],
    args.ftpW ?? null,
    args.powerSimulated ?? false,
  );
  // Mechanical work in kJ is close to the kcal burned (human efficiency ~ 24 %).
  const withPower = (summary: SessionSummary): SessionSummary =>
    power ? { ...summary, kcalEstimated: power.kJ, power } : summary;
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
    return withPower({
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
    });
  }
  return withPower({
    ...base,
    load: zoneLoad(actual),
    kcalEstimated: kcalByMet(actual, weightKg),
  });
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
