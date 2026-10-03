import type { GpxPoint } from './gpx';

/** Distance between consecutive route points. */
export const ROUTE_SPACING_M = 10;
/** Elevation is smoothed over this many points either side (±50 m), with triangular weights. */
const SMOOTH_HALF_WINDOW = 5;
/** Grades beyond this are GPS noise on a road, not real. */
export const MAX_GRADE = 0.25;

/** One point every 10 m along the route. `ele` is already smoothed. */
export interface RoutePoint {
  distanceM: number;
  lat: number;
  lon: number;
  ele: number;
}

export interface Route {
  id: string;
  name: string;
  description?: string;
  source: 'builtin' | 'gpx';
  /** First → last point; a loop route also starts where it ends. */
  distanceM: number;
  ascentM: number;
  descentM: number;
  /** Steepest climbing segment, as rise/run (0.08 = 8 %). */
  maxGrade: number;
  points: RoutePoint[];
}

const EARTH_RADIUS_M = 6_371_000;
const rad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance in metres. */
export function haversineM(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
): number {
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Missing elevations are interpolated between the nearest known ones (or copied at the ends). */
function fillElevation(points: readonly GpxPoint[]): { lat: number; lon: number; ele: number }[] {
  const known = points
    .map((p, i) => (p.ele === null ? null : i))
    .filter((i): i is number => i !== null);
  return points.map((p, i) => {
    if (p.ele !== null) return { lat: p.lat, lon: p.lon, ele: p.ele };
    const before = [...known].reverse().find((k) => k < i);
    const after = known.find((k) => k > i);
    const eb = before === undefined ? null : (points[before]?.ele ?? null);
    const ea = after === undefined ? null : (points[after]?.ele ?? null);
    let ele = eb ?? ea ?? 0;
    if (before !== undefined && after !== undefined && eb !== null && ea !== null) {
      ele = eb + ((ea - eb) * (i - before)) / (after - before);
    }
    return { lat: p.lat, lon: p.lon, ele };
  });
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Gradient of the segment that starts at point `i` (0 for the last point). */
export function segmentGrade(points: readonly RoutePoint[], i: number): number {
  const a = points[i];
  const b = points[i + 1];
  if (!a || !b || b.distanceM <= a.distanceM) return 0;
  const g = (b.ele - a.ele) / (b.distanceM - a.distanceM);
  return Math.max(-MAX_GRADE, Math.min(MAX_GRADE, g));
}

/**
 * Turns raw track points into a route: cumulative distance, a point every 10 m,
 * elevation smoothed over ±50 m so GPS noise doesn't become fake gradients,
 * and the totals. Returns null if the track has no length.
 */
export function buildRoute(
  raw: readonly GpxPoint[],
  meta: { id: string; name: string; source: Route['source'] },
): Route | null {
  const pts = fillElevation(raw);
  // Cumulative distance, dropping points that don't move.
  const track: { d: number; lat: number; lon: number; ele: number }[] = [];
  for (const p of pts) {
    const prev = track[track.length - 1];
    if (!prev) {
      track.push({ d: 0, ...p });
      continue;
    }
    const step = haversineM(prev, p);
    if (step > 0) track.push({ d: prev.d + step, ...p });
  }
  const last = track[track.length - 1];
  if (!last || last.d <= 0) return null;

  // Resample every 10 m, plus the exact end.
  const resampled: RoutePoint[] = [];
  let j = 0;
  const distances: number[] = [];
  // 1 cm tolerance: floating point can put the end a hair past a 10 m mark.
  for (let d = 0; d < last.d - 0.01; d += ROUTE_SPACING_M) distances.push(d);
  distances.push(last.d);
  for (const d of distances) {
    while (j < track.length - 2 && (track[j + 1]?.d ?? Infinity) < d) j++;
    const a = track[j];
    const b = track[j + 1] ?? a;
    if (!a || !b) continue;
    const t = b.d > a.d ? Math.min(1, Math.max(0, (d - a.d) / (b.d - a.d))) : 0;
    resampled.push({
      distanceM: d,
      lat: lerp(a.lat, b.lat, t),
      lon: lerp(a.lon, b.lon, t),
      ele: lerp(a.ele, b.ele, t),
    });
  }

  // Triangular-weighted average of elevation: a GPS spike becomes a gentle bump
  // instead of a plateau with steep edges. The window shrinks at the ends so they stay put.
  const smoothed = resampled.map((p, i) => {
    const k = Math.min(SMOOTH_HALF_WINDOW, i, resampled.length - 1 - i);
    let sum = 0;
    let weights = 0;
    for (let n = i - k; n <= i + k; n++) {
      const w = k + 1 - Math.abs(n - i);
      sum += w * (resampled[n]?.ele ?? p.ele);
      weights += w;
    }
    return { ...p, ele: sum / weights };
  });

  let ascentM = 0;
  let descentM = 0;
  let maxGrade = 0;
  for (let i = 0; i < smoothed.length - 1; i++) {
    const diff = (smoothed[i + 1]?.ele ?? 0) - (smoothed[i]?.ele ?? 0);
    if (diff > 0) ascentM += diff;
    else descentM -= diff;
    maxGrade = Math.max(maxGrade, segmentGrade(smoothed, i));
  }

  return { ...meta, distanceM: last.d, ascentM, descentM, maxGrade, points: smoothed };
}
