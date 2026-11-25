import type { Route } from '../route/route';

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

/** Projects a route onto a flat local map around its centre (fine for a few tens of km). */
export function projectRoute(route: Route): WorldPath {
  const pts = route.points;
  const lat0 = pts.reduce((s, p) => s + p.lat, 0) / Math.max(1, pts.length);
  const lon0 = pts.reduce((s, p) => s + p.lon, 0) / Math.max(1, pts.length);
  const minEle = Math.min(...pts.map((p) => p.ele));
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
  return { points, distanceM: route.distanceM, closed };
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

/** Where the rider is and which way they face, from the road ±`lookM` around them. */
export function poseAt(path: WorldPath, d: number, lookM = 5): Pose {
  const back = pointAt(path, d - lookM);
  const ahead = pointAt(path, d + lookM);
  const dx = ahead.x - back.x;
  const dz = ahead.z - back.z;
  return {
    position: pointAt(path, d),
    heading: Math.atan2(dx, -dz),
    pitch: Math.atan2(ahead.y - back.y, Math.hypot(dx, dz) || 1),
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
