import { hasKcal, type SessionSummary } from '../domain/metrics/summary';
import { builtinRoutes } from '../domain/route/examples';
import type { RecordSample } from './recording';
import { buildTcx, tcxFileName } from './tcx';

/** Strava's manual upload page (no API: the user picks the downloaded file). */
export const STRAVA_UPLOAD_URL = 'https://www.strava.com/upload/select';

let builtinIds: Set<string> | null = null;
const isBuiltinRoute = (id: string) =>
  (builtinIds ??= new Set(builtinRoutes().map((r) => r.id))).has(id);

/** A session with any simulated reading: never offered to Strava. */
export function isSimulatedSession(summary: SessionSummary): boolean {
  return !!(summary.hrMeasured?.simulated || summary.power?.simulated);
}

/**
 * The file of a session for Strava, Garmin Connect or the coach: TCX for now
 * (FIT comes in phase 15b). Power is marked as estimated in the notes, and the
 * made-up example routes carry no position (they are not real places).
 */
export function sessionFile(
  summary: SessionSummary,
  recording: { startMs: number; samples: readonly RecordSample[] },
): { fileName: string; content: string; type: string } {
  const content = buildTcx({
    name: summary.workoutName,
    startMs: recording.startMs,
    samples: recording.samples,
    kcal: hasKcal(summary) ? summary.kcalEstimated : null,
    powerEstimated: !!summary.power,
    simulated: isSimulatedSession(summary),
    includePosition: !(summary.ride && isBuiltinRoute(summary.ride.routeId)),
  });
  return {
    fileName: tcxFileName(recording.startMs, summary.workoutName),
    content,
    type: 'application/vnd.garmin.tcx+xml',
  };
}
