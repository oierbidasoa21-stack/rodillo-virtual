import type { Route } from './route';

/** A climb worth announcing on a route. */
export interface Climb {
  startM: number;
  endM: number;
  gainM: number;
  /** Average grade, as a fraction (0.06 = 6 %). */
  avgGrade: number;
}

/** A stretch counts as climbing above this grade (over 100 m). */
const CLIMBING_GRADE = 0.025;
/** Flatter gaps shorter than this do not split a climb. */
const MAX_GAP_M = 150;
/** Shorter or lower climbs are not announced. */
const MIN_LENGTH_M = 300;
const MIN_GAIN_M = 15;
const STEP_M = 25;

/** Height of the route at `d` (linear between points). */
function heightAt(route: Route, d: number): number {
  const pts = route.points;
  if (!pts.length) return 0;
  let lo = 0;
  let hi = pts.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if ((pts[mid]?.distanceM ?? 0) <= d) lo = mid;
    else hi = mid;
  }
  const a = pts[lo];
  const b = pts[hi];
  if (!a || !b) return 0;
  const span = b.distanceM - a.distanceM;
  const t = span > 0 ? Math.min(1, Math.max(0, (d - a.distanceM) / span)) : 0;
  return a.ele + (b.ele - a.ele) * t;
}

/**
 * The climbs of a route: stretches that rise more than 2.5 % (measured over
 * 100 m windows), joined across short flatter gaps, at least 300 m long and
 * 15 m high.
 */
export function findClimbs(route: Route): Climb[] {
  const total = route.distanceM;
  const climbs: Climb[] = [];
  let start: number | null = null;
  let lastUp = 0;
  const close = () => {
    if (start === null) return;
    // The 100 m window overshoots both ends: trim flat 25 m pieces off them.
    const steep = (d: number) =>
      (heightAt(route, d + STEP_M) - heightAt(route, d)) / STEP_M >= CLIMBING_GRADE;
    let from = start;
    let to = Math.min(lastUp, total);
    while (to - from > STEP_M && !steep(from)) from += STEP_M;
    while (to - from > STEP_M && !steep(to - STEP_M)) to -= STEP_M;
    const gain = heightAt(route, to) - heightAt(route, from);
    const length = to - from;
    if (length >= MIN_LENGTH_M && gain >= MIN_GAIN_M) {
      climbs.push({ startM: from, endM: to, gainM: gain, avgGrade: gain / length });
    }
    start = null;
  };
  for (let d = 0; d + 100 <= total; d += STEP_M) {
    const grade = (heightAt(route, d + 100) - heightAt(route, d)) / 100;
    if (grade >= CLIMBING_GRADE) {
      if (start === null) start = d;
      lastUp = d + 100;
    } else if (start !== null && d - lastUp > MAX_GAP_M) {
      close();
    }
  }
  close();
  return climbs;
}
