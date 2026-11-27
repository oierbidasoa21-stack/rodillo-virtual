import type { Route } from '../route/route';
import { extent } from '../extent';

/**
 * World coordinates in metres: x east, y up, z south (so -z is north, as in
 * Three.js, where the camera looks down -z). y is height above the route's
 * lowest point.
 */
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface PathPoint extends Vec3 {
  /** Distance along the route. */
  d: number;
}

export interface WorldPath {
  points: PathPoint[];
  distanceM: number;
  /** Ends where it starts (within 30 m): the road closes on itself. */
  closed: boolean;
}

const EARTH_RADIUS_M = 6_371_000;
const rad = (deg: number) => (deg * Math.PI) / 180;

/** Spacing of the smoothed path the 3D world is built from (the route itself is every 10 m). */
export const SMOOTH_STEP_M = 1;

/**
 * Projects a route onto a flat local map around its centre (fine for a few tens
 * of km) and smooths it in plan (see `smoothPath`), so curves are curves and
 * not a polyline with a corner every 10 m.
 */
export function projectRoute(route: Route): WorldPath {
  const pts = route.points;
  const lat0 = pts.reduce((s, p) => s + p.lat, 0) / Math.max(1, pts.length);
  const lon0 = pts.reduce((s, p) => s + p.lon, 0) / Math.max(1, pts.length);
  const minEle = extent(pts.map((p) => p.ele)).min;
  const k = EARTH_RADIUS_M * Math.cos(rad(lat0));
  const points = pts.map((p) => ({
    x: rad(p.lon - lon0) * k,
    y: p.ele - minEle,
    z: -rad(p.lat - lat0) * EARTH_RADIUS_M,
    d: p.distanceM,
  }));
  const first = points[0];
  const last = points.at(-1);
  const closed =
    !!first && !!last && points.length > 2 && Math.hypot(first.x - last.x, first.z - last.z) < 30;
  return { points: smoothPath(points, closed), distanceM: route.distanceM, closed };
}

/** Centripetal Catmull-Rom (alpha 0.5): no cusps or loops, even with uneven points. */
function catmullRom(
  p0: PathPoint,
  p1: PathPoint,
  p2: PathPoint,
  p3: PathPoint,
  u: number,
): { x: number; z: number } {
  const knot = (a: PathPoint, b: PathPoint) =>
    Math.max(1e-6, Math.sqrt(Math.hypot(b.x - a.x, b.z - a.z)));
  const t0 = 0;
  const t1 = t0 + knot(p0, p1);
  const t2 = t1 + knot(p1, p2);
  const t3 = t2 + knot(p2, p3);
  const t = t1 + (t2 - t1) * u;
  const mix = (a: PathPoint | { x: number; z: number }, b: typeof a, ta: number, tb: number) => {
    const wa = (tb - t) / (tb - ta);
    const wb = (t - ta) / (tb - ta);
    return { x: a.x * wa + b.x * wb, z: a.z * wa + b.z * wb };
  };
  const a1 = mix(p0, p1, t0, t1);
  const a2 = mix(p1, p2, t1, t2);
  const a3 = mix(p2, p3, t2, t3);
  const b1 = mix(a1, a2, t0, t2);
  const b2 = mix(a2, a3, t1, t3);
  return mix(b1, b2, t1, t2);
}

/**
 * The path through the route points as a smooth curve in plan, sampled every
 * `stepM`. It passes through every original point. Height and distance along
 * the route (`d`) are interpolated linearly, so `d` keeps meaning «metres of
 * the route» and the 3D rider stays in step with the HUD and the recording.
 */
export function smoothPath(
  pts: readonly PathPoint[],
  closed: boolean,
  stepM = SMOOTH_STEP_M,
): PathPoint[] {
  const n = pts.length;
  if (n < 3) return pts.slice();
  return closed ? smoothLoop(pts, stepM) : smoothOpen(pts, stepM);
}

/** Samples the curve from `p1` to `p2` (exclusive), with distances from `d1` to `d2`. */
function sampleSegment(
  out: PathPoint[],
  p0: PathPoint,
  p1: PathPoint,
  p2: PathPoint,
  p3: PathPoint,
  d1: number,
  d2: number,
  stepM: number,
): void {
  const steps = Math.max(1, Math.round((d2 - d1) / stepM));
  for (let k = 0; k < steps; k++) {
    const u = k / steps;
    const { x, z } = catmullRom(p0, p1, p2, p3, u);
    out.push({ x, z, y: p1.y + (p2.y - p1.y) * u, d: d1 + (d2 - d1) * u });
  }
}

/** Open route: past the ends the neighbour is mirrored, so the curve leaves straight. */
function smoothOpen(pts: readonly PathPoint[], stepM: number): PathPoint[] {
  const n = pts.length;
  const at = (i: number): PathPoint => {
    if (i < 0) {
      const a = pts[0] as PathPoint;
      const b = pts[1] as PathPoint;
      return { x: 2 * a.x - b.x, y: a.y, z: 2 * a.z - b.z, d: a.d };
    }
    if (i > n - 1) {
      const a = pts[n - 1] as PathPoint;
      const b = pts[n - 2] as PathPoint;
      return { x: 2 * a.x - b.x, y: a.y, z: 2 * a.z - b.z, d: a.d };
    }
    return pts[i] as PathPoint;
  };
  const out: PathPoint[] = [];
  for (let i = 0; i < n - 1; i++) {
    const p1 = pts[i] as PathPoint;
    const p2 = pts[i + 1] as PathPoint;
    sampleSegment(out, at(i - 1), p1, p2, at(i + 2), p1.d, p2.d, stepM);
  }
  out.push({ ...(pts[n - 1] as PathPoint) });
  return out;
}

/**
 * Closed route («closed» means its ends are less than 30 m apart, not that the
 * last point repeats the first): the loop is closed explicitly, with the
 * closing stretch from the last point back to the first drawn with the same
 * curve, so there is neither a gap nor a kink where it joins. The closing
 * stretch gets distances past the route's length: the road is drawn there, but
 * positions (which wrap at the route's length) jump it at each lap, as the 2D
 * view and the recording do.
 */
function smoothLoop(pts: readonly PathPoint[], stepM: number): PathPoint[] {
  const first = pts[0] as PathPoint;
  const last = pts[pts.length - 1] as PathPoint;
  const gap = Math.hypot(last.x - first.x, last.z - first.z);
  const repeats = gap < 0.5;
  // The loop's own points, without a last point that repeats the first.
  const ring = repeats ? pts.slice(0, -1) : pts.slice();
  const m = ring.length;
  const at = (i: number) => ring[((i % m) + m) % m] as PathPoint;
  const endD = repeats ? last.d : last.d + gap;
  const out: PathPoint[] = [];
  for (let i = 0; i < m; i++) {
    const p1 = at(i);
    const closing = i === m - 1;
    const p2 = closing ? first : at(i + 1);
    sampleSegment(out, at(i - 1), p1, p2, at(i + 2), p1.d, closing ? endD : p2.d, stepM);
  }
  out.push({ ...first, d: endD });
  return out;
}

/** Index of the segment containing distance `d` (already wrapped into the route). */
function segmentAt(points: readonly PathPoint[], d: number): number {
  let lo = 0;
  let hi = points.length - 2;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if ((points[mid]?.d ?? 0) <= d) lo = mid;
    else hi = mid - 1;
  }
  return Math.max(0, lo);
}

/**
 * The point `d` metres along the path. On a closed path it wraps around; on an
 * open one it continues in a straight line past either end, so the camera can
 * sit behind the start.
 */
export function pointAt(path: WorldPath, d: number): Vec3 {
  const pts = path.points;
  const first = pts[0];
  const last = pts.at(-1);
  if (!first || !last) return { x: 0, y: 0, z: 0 };
  if (pts.length === 1) return { x: first.x, y: first.y, z: first.z };
  let dd = d;
  if (path.closed && path.distanceM > 0)
    dd = ((d % path.distanceM) + path.distanceM) % path.distanceM;
  const i = segmentAt(pts, Math.min(Math.max(dd, first.d), last.d));
  const a = pts[i] ?? first;
  const b = pts[i + 1] ?? last;
  const span = b.d - a.d || 1;
  const t = (dd - a.d) / span; // < 0 or > 1 past the ends: straight extrapolation
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t };
}

/** Pose on the road: position, heading (radians, 0 = north/-z, growing towards east/+x) and pitch. */
export interface Pose {
  position: Vec3;
  heading: number;
  pitch: number;
}

/** Half-window for the heading: on the smoothed path this is the tangent. */
const TANGENT_M = SMOOTH_STEP_M;

/**
 * Where the rider is and which way they face. The heading is the tangent of
 * the (smoothed) road; the pitch averages the slope over ±`lookM`, so small
 * bumps in the altitude do not rock the rider.
 */
export function poseAt(path: WorldPath, d: number, lookM = 5): Pose {
  const before = pointAt(path, d - TANGENT_M);
  const after = pointAt(path, d + TANGENT_M);
  const back = pointAt(path, d - lookM);
  const ahead = pointAt(path, d + lookM);
  return {
    position: pointAt(path, d),
    heading: Math.atan2(after.x - before.x, -(after.z - before.z)),
    pitch: Math.atan2(ahead.y - back.y, Math.hypot(ahead.x - back.x, ahead.z - back.z) || 1),
  };
}

/** Chase camera: behind and above the rider, looking a little ahead along the road. */
export function chaseCamera(
  path: WorldPath,
  d: number,
  opts: { backM?: number; heightM?: number; aheadM?: number } = {},
): { position: Vec3; target: Vec3 } {
  const { backM = 7, heightM = 2.6, aheadM = 12 } = opts;
  const behind = pointAt(path, d - backM);
  const ahead = pointAt(path, d + aheadM);
  return {
    position: { x: behind.x, y: behind.y + heightM, z: behind.z },
    target: { x: ahead.x, y: ahead.y + 1, z: ahead.z },
  };
}
