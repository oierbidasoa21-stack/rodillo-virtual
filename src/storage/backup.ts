import type {
  HrMeasured,
  PowerSummary,
  RideSummary,
  SecByPowerZone,
  SessionSummary,
} from '../domain/metrics/summary';
import type { Route, RoutePoint } from '../domain/route/route';
import { POWER_ZONE_IDS } from '../domain/zones/powerZones';
import { emptySecByZone, type SecByZone } from '../domain/metrics/timeInZone';
import type { HrCount } from '../domain/workout/player';
import { migrateWorkout } from '../domain/workout/migrate';
import type { Workout } from '../domain/workout/types';
import type { ParseResult } from '../domain/zones/athleteConfig';
import { ZONE_IDS, isZoneId } from '../domain/zones/zones';
import type { Storage } from './repositories';
import { type AppSettings, normalizeSettings } from './settings';

export const BACKUP_APP = 'rodillo-virtual';
/** 2 added imported routes; format 1 files (no routes) are still accepted. */
export const BACKUP_FORMAT = 2;
const READABLE_FORMATS: readonly number[] = [1, 2];

/** Everything the app stores in this browser, as one JSON file. */
export interface Backup {
  app: typeof BACKUP_APP;
  format: typeof BACKUP_FORMAT;
  exportedAtMs: number;
  workouts: Workout[];
  history: SessionSummary[];
  settings: AppSettings;
  routes: Route[];
}

/** A parsed backup plus what had to be left out. */
export interface ParsedBackup {
  backup: Backup;
  skipped: { workouts: number; history: number; routes: number };
}

export async function exportBackup(storage: Storage, nowMs: number): Promise<Backup> {
  const [workouts, history, settings, routes] = await Promise.all([
    storage.listWorkouts(),
    storage.listHistory(),
    storage.getSettings(),
    storage.listRoutes(),
  ]);
  return {
    app: BACKUP_APP,
    format: BACKUP_FORMAT,
    exportedAtMs: nowMs,
    workouts,
    history,
    settings,
    routes,
  };
}

export async function importBackup(storage: Storage, backup: Backup): Promise<void> {
  await storage.replaceAll(backup);
}

/** `rodillo-virtual-copia-2026-10-03.json`, with the local date (not UTC). */
export function backupFileName(nowMs: number): string {
  const d = new Date(nowMs);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `rodillo-virtual-copia-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.json`;
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

function parseSecByZone(v: unknown): SecByZone | null {
  if (!isRecord(v)) return null;
  const out = emptySecByZone();
  for (const id of ZONE_IDS) {
    const sec = v[id];
    if (!isNum(sec)) return null;
    out[id] = sec;
  }
  return out;
}

function parseCount(v: unknown): HrCount | null {
  if (!isRecord(v) || !isNum(v.atSec) || !isNum(v.valuePer10s) || !isZoneId(v.targetZoneId)) {
    return null;
  }
  const status =
    v.status === 'in' || v.status === 'above' || v.status === 'below' ? v.status : null;
  if (!status) return null;
  return { atSec: v.atSec, valuePer10s: v.valuePer10s, targetZoneId: v.targetZoneId, status };
}

function parseHrMeasured(v: unknown): HrMeasured | undefined {
  if (!isRecord(v)) return undefined;
  const secByZone = parseSecByZone(v.secByZone);
  if (!secByZone || !isNum(v.belowSec) || !isNum(v.coveredSec) || !isNum(v.avgBpm))
    return undefined;
  if (!isNum(v.maxBpm)) return undefined;
  return {
    secByZone,
    belowSec: v.belowSec,
    coveredSec: v.coveredSec,
    avgBpm: v.avgBpm,
    maxBpm: v.maxBpm,
    simulated: v.simulated === true,
  };
}

const numOrNull = (v: unknown): number | null | undefined =>
  v === null ? null : isNum(v) ? v : undefined;

function parsePowerZones(v: unknown): SecByPowerZone | null | undefined {
  if (v === null) return null;
  if (!isRecord(v)) return undefined;
  const out = {} as SecByPowerZone;
  for (const id of POWER_ZONE_IDS) {
    const sec = v[id];
    if (!isNum(sec)) return undefined;
    out[id] = sec;
  }
  return out;
}

function parsePower(v: unknown): PowerSummary | undefined {
  if (!isRecord(v)) return undefined;
  const npW = numOrNull(v.npW);
  const ifactor = numOrNull(v.ifactor);
  const tss = numOrNull(v.tss);
  const zones = parsePowerZones(v.secByPowerZone);
  if (!isNum(v.avgW) || !isNum(v.maxW) || !isNum(v.kJ) || !isNum(v.coveredSec)) return undefined;
  if (npW === undefined || ifactor === undefined || tss === undefined || zones === undefined) {
    return undefined;
  }
  return {
    avgW: v.avgW,
    maxW: v.maxW,
    npW,
    ifactor,
    tss,
    kJ: v.kJ,
    coveredSec: v.coveredSec,
    secByPowerZone: zones,
    estimated: true,
    simulated: v.simulated === true,
  };
}

function parseRide(v: unknown): RideSummary | undefined {
  if (!isRecord(v) || typeof v.routeId !== 'string' || typeof v.routeName !== 'string') {
    return undefined;
  }
  if (!isNum(v.distanceM) || !isNum(v.ascentM) || !isNum(v.avgSpeedKmh)) return undefined;
  if (v.mode !== 'power' && v.mode !== 'wheel') return undefined;
  return {
    routeId: v.routeId,
    routeName: v.routeName,
    distanceM: v.distanceM,
    ascentM: v.ascentM,
    avgSpeedKmh: v.avgSpeedKmh,
    mode: v.mode,
    laps: isNum(v.laps) ? v.laps : 0,
  };
}

/** An imported route, or null if any point or total is unreadable. */
function parseRoute(v: unknown): Route | null {
  if (!isRecord(v) || typeof v.id !== 'string' || typeof v.name !== 'string') return null;
  if (!isNum(v.distanceM) || !isNum(v.ascentM) || !isNum(v.descentM) || !isNum(v.maxGrade)) {
    return null;
  }
  if (!Array.isArray(v.points) || v.points.length < 2) return null;
  const points: RoutePoint[] = [];
  for (const p of v.points as unknown[]) {
    if (!isRecord(p) || !isNum(p.distanceM) || !isNum(p.lat) || !isNum(p.lon) || !isNum(p.ele)) {
      return null;
    }
    points.push({ distanceM: p.distanceM, lat: p.lat, lon: p.lon, ele: p.ele });
  }
  return {
    id: v.id,
    name: v.name,
    ...(typeof v.description === 'string' ? { description: v.description } : {}),
    source: 'gpx',
    distanceM: v.distanceM,
    ascentM: v.ascentM,
    descentM: v.descentM,
    maxGrade: v.maxGrade,
    points,
  };
}

/** A history entry, or null if it's missing anything the app needs to show it. */
function parseSession(v: unknown): SessionSummary | null {
  if (!isRecord(v) || typeof v.id !== 'string' || typeof v.workoutName !== 'string') return null;
  if (!isNum(v.dateMs) || !isNum(v.durationSec) || !isNum(v.load) || !isNum(v.kcalEstimated)) {
    return null;
  }
  const planned = parseSecByZone(v.plannedSecByZone);
  const actual = parseSecByZone(v.actualSecByZone);
  if (!planned || !actual) return null;
  const counts = Array.isArray(v.counts)
    ? v.counts.map(parseCount).filter((c): c is HrCount => c !== null)
    : [];
  const hrMeasured = parseHrMeasured(v.hrMeasured);
  const power = parsePower(v.power);
  const ride = parseRide(v.ride);
  return {
    id: v.id,
    dateMs: v.dateMs,
    workoutName: v.workoutName,
    durationSec: v.durationSec,
    load: v.load,
    kcalEstimated: v.kcalEstimated,
    plannedSecByZone: planned,
    actualSecByZone: actual,
    counts,
    ...(hrMeasured ? { hrMeasured } : {}),
    ...(power ? { power } : {}),
    ...(ride ? { ride } : {}),
  };
}

/**
 * Validates a backup file. Workouts from older versions are migrated; entries
 * that can't be read are skipped and counted, never guessed.
 */
export function parseBackup(input: unknown): ParseResult<ParsedBackup> {
  if (!isRecord(input) || input.app !== BACKUP_APP) {
    return { ok: false, errors: ['El archivo no es una copia de Rodillo Virtual.'] };
  }
  if (typeof input.format !== 'number' || !READABLE_FORMATS.includes(input.format)) {
    return {
      ok: false,
      errors: [`Formato de copia no compatible (${String(input.format)}). Actualiza la app.`],
    };
  }
  if (!Array.isArray(input.workouts) || !Array.isArray(input.history)) {
    return { ok: false, errors: ['A la copia le faltan las sesiones o el historial.'] };
  }

  const workouts = input.workouts.map(migrateWorkout).filter((w): w is Workout => w !== null);
  const history = input.history.map(parseSession).filter((s): s is SessionSummary => s !== null);
  const rawRoutes: unknown[] = Array.isArray(input.routes) ? input.routes : [];
  const routes = rawRoutes.map(parseRoute).filter((r): r is Route => r !== null);
  return {
    ok: true,
    value: {
      backup: {
        app: BACKUP_APP,
        format: BACKUP_FORMAT,
        exportedAtMs: isNum(input.exportedAtMs) ? input.exportedAtMs : 0,
        workouts,
        history,
        settings: normalizeSettings(isRecord(input.settings) ? input.settings : undefined),
        routes,
      },
      skipped: {
        workouts: input.workouts.length - workouts.length,
        history: input.history.length - history.length,
        routes: rawRoutes.length - routes.length,
      },
    },
  };
}
