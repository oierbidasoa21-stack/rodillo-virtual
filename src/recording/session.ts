import {
  type SessionSummary,
  buildRideSummary,
  buildSessionSummary,
  rideSummaryOf,
} from '../domain/metrics/summary';
import type { RideMode, RideState } from '../domain/route/ride';
import type { Route } from '../domain/route/route';
import type { PlayerState } from '../domain/workout/player';
import type { Workout } from '../domain/workout/types';
import type { RecorderState } from './recorder';
import type { RecordSample } from './recording';

/**
 * A session in progress, saved every few seconds so it survives a closed tab.
 * Workouts (optionally on a route) and free rides on a route.
 */
export type SessionSnapshot =
  | {
      kind: 'workout';
      savedAtMs: number;
      workout: Workout;
      playMode: 'normal' | 'ramp';
      player: PlayerState;
      route: { route: Route; mode: RideMode } | null;
      ride: RideState;
      recorder: RecorderState;
    }
  | {
      kind: 'ride';
      savedAtMs: number;
      route: Route;
      mode: RideMode;
      ride: RideState;
      recorder: RecorderState;
    };

/** The samples saved with a history entry. */
export interface SessionRecording {
  sessionId: string;
  startMs: number;
  samples: RecordSample[];
}

export function snapshotName(s: SessionSnapshot): string {
  return s.kind === 'workout' ? s.workout.name : s.route.name;
}

/** Moving time recorded so far. */
export function snapshotElapsedSec(s: SessionSnapshot): number {
  return s.recorder.recording.samples.length;
}

/**
 * History entry for a session, finished now or recovered from a snapshot. Uses the
 * same builders as the player and the race view.
 */
export function summaryFromSnapshot(
  s: SessionSnapshot,
  args: { id: string; dateMs: number; weightKg: number; ftpW: number | null },
): SessionSummary {
  const r = s.recorder;
  const common = {
    id: args.id,
    dateMs: args.dateMs,
    weightKg: args.weightKg,
    hr: r.hrTime,
    hrSimulated: r.hrSimulated,
    powerSamples: r.power.samples,
    powerSimulated: r.powerSimulated,
    ftpW: args.ftpW,
  };
  if (s.kind === 'ride') {
    return buildRideSummary({ ...common, route: s.route, ride: s.ride, mode: s.mode });
  }
  return buildSessionSummary({
    ...common,
    workoutName: s.workout.name,
    player: s.player,
    hrCap: { cappedSec: r.capSec ?? 0, aboveSec: r.aboveCapSec ?? 0 },
    ...(s.route ? { ride: rideSummaryOf(s.route.route, s.ride, s.route.mode) } : {}),
  });
}

export function recordingOf(sessionId: string, r: RecorderState): SessionRecording {
  return { sessionId, startMs: r.recording.startMs, samples: r.recording.samples };
}
