import { countsForFitness } from '../domain/metrics/fitness';
import type { SessionSummary } from '../domain/metrics/summary';
import type { RecordSample } from './recording';

/**
 * A previous ride on the same route, replayed: where it was at each second of
 * riding time. Built from the session's own recording, so nothing is invented.
 */
export interface Ghost {
  sessionId: string;
  dateMs: number;
  /** Riding seconds and the route distance reached then; both never decrease. */
  t: number[];
  d: number[];
}

/** A ghost from a recording's samples, or null without enough distance data. */
export function ghostFrom(
  sessionId: string,
  dateMs: number,
  samples: readonly RecordSample[],
): Ghost | null {
  const t: number[] = [];
  const d: number[] = [];
  for (const s of samples) {
    if (s.distanceM === null) continue;
    // Keep distance non-decreasing (a sensor hiccup must not make it ride backwards).
    const dist = Math.max(s.distanceM, d.at(-1) ?? 0);
    t.push(s.t);
    d.push(dist);
  }
  if (t.length < 2 || (d.at(-1) ?? 0) < 100) return null;
  return { sessionId, dateMs, t, d };
}

/** Index of the last entry of `xs` that is ≤ `x` (xs sorted), or -1. */
function floorIndex(xs: readonly number[], x: number): number {
  let lo = -1;
  let hi = xs.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if ((xs[mid] ?? Infinity) <= x) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

function lerp(xs: readonly number[], ys: readonly number[], x: number): number {
  const i = floorIndex(xs, x);
  if (i < 0) return ys[0] ?? 0;
  if (i >= xs.length - 1) return ys.at(-1) ?? 0;
  const x0 = xs[i] ?? 0;
  const x1 = xs[i + 1] ?? x0;
  const y0 = ys[i] ?? 0;
  const y1 = ys[i + 1] ?? y0;
  return x1 > x0 ? y0 + ((y1 - y0) * (x - x0)) / (x1 - x0) : y1;
}

/** Where the ghost was after `elapsedSec` of riding (it stops where its ride ended). */
export function ghostDistanceAt(g: Ghost, elapsedSec: number): number {
  return lerp(g.t, g.d, elapsedSec);
}

/** Ghost speed around `elapsedSec`, in m/s (for its pedalling and wheels). */
export function ghostSpeedAt(g: Ghost, elapsedSec: number): number {
  return Math.max(0, (ghostDistanceAt(g, elapsedSec + 2) - ghostDistanceAt(g, elapsedSec - 2)) / 4);
}

/** When the ghost reached `distanceM`, or null if it never got that far. */
export function ghostTimeAt(g: Ghost, distanceM: number): number | null {
  if (distanceM > (g.d.at(-1) ?? 0)) return null;
  // First index where the ghost reached the distance (distances can repeat while stopped).
  let lo = 0;
  let hi = g.d.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if ((g.d[mid] ?? 0) >= distanceM) hi = mid;
    else lo = mid + 1;
  }
  if (lo === 0) return g.t[0] ?? 0;
  const d0 = g.d[lo - 1] ?? 0;
  const d1 = g.d[lo] ?? d0;
  const t0 = g.t[lo - 1] ?? 0;
  const t1 = g.t[lo] ?? t0;
  return d1 > d0 ? t0 + ((t1 - t0) * (distanceM - d0)) / (d1 - d0) : t1;
}

/**
 * Seconds behind (+) or ahead of (−) the ghost: how much later than the ghost
 * you reached the distance you are at. Null past the end of the ghost's ride.
 */
export function gapToGhostSec(g: Ghost, distanceM: number, elapsedSec: number): number | null {
  const at = ghostTimeAt(g, distanceM);
  return at === null ? null : elapsedSec - at;
}

/** Rides shorter than this are not worth racing. */
const MIN_GHOST_M = 1000;

/**
 * The session to race on a route: the fastest earlier ride on it (average
 * speed) covering at least 1 km, never one with simulated sensors.
 */
export function bestRideOn(
  sessions: readonly SessionSummary[],
  routeId: string,
): SessionSummary | null {
  let best: SessionSummary | null = null;
  for (const s of sessions) {
    if (!s.ride || s.ride.routeId !== routeId || s.ride.distanceM < MIN_GHOST_M) continue;
    if (!countsForFitness(s)) continue;
    if (!best || s.ride.avgSpeedKmh > (best.ride?.avgSpeedKmh ?? 0)) best = s;
  }
  return best;
}
