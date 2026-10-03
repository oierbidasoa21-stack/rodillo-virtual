import { ROUTE_SPACING_M, type Route, segmentGrade } from './route';

export interface RoutePosition {
  /** Metres into the current lap. */
  lapDistanceM: number;
  /** Completed laps. */
  lap: number;
  ele: number;
  /** Gradient of the road right here (rise/run). */
  grade: number;
  lat: number;
  lon: number;
}

/**
 * Where a rider is after riding `distanceM` in total. On a loop the route
 * repeats; otherwise the position stops at the end.
 */
export function positionAt(route: Route, distanceM: number, loop = false): RoutePosition {
  const total = route.distanceM;
  const ridden = Math.max(0, distanceM);
  const lap = loop ? Math.floor(ridden / total) : 0;
  let d = loop ? ridden - lap * total : Math.min(ridden, total);
  // Exactly at the end of a lap is the start of the next one.
  if (loop && d >= total) d = 0;

  const pts = route.points;
  const i = Math.min(Math.floor(d / ROUTE_SPACING_M), pts.length - 2);
  const a = pts[i];
  const b = pts[i + 1] ?? a;
  if (!a || !b) return { lapDistanceM: d, lap, ele: 0, grade: 0, lat: 0, lon: 0 };
  const t =
    b.distanceM > a.distanceM ? Math.min(1, (d - a.distanceM) / (b.distanceM - a.distanceM)) : 0;
  return {
    lapDistanceM: d,
    lap,
    ele: a.ele + (b.ele - a.ele) * t,
    grade: segmentGrade(pts, i),
    lat: a.lat + (b.lat - a.lat) * t,
    lon: a.lon + (b.lon - a.lon) * t,
  };
}
