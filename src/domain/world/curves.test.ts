import { describe, expect, it } from 'vitest';
import { buildRoute } from '../route/route';
import { type PathPoint, type WorldPath, pointAt, poseAt, projectRoute, smoothPath } from './path';

/** Wraps an angle difference to (-π, π]. */
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

/**
 * Half a circle of radius `radiusM` around the origin, one point every ~10 m
 * exactly on the circle (like the route's points), turning right. `d` is the
 * distance along the arc.
 */
function arcPoints(radiusM: number): PathPoint[] {
  const n = Math.round((Math.PI * radiusM) / 10);
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = (i * Math.PI) / n;
    return { x: radiusM * Math.cos(a), y: 0, z: radiusM * Math.sin(a), d: a * radiusM };
  });
}

describe('smooth curves', () => {
  const R = 100;
  const raw = arcPoints(R);
  const polyline: WorldPath = { points: raw, distanceM: Math.PI * R, closed: false };
  const smooth: WorldPath = { ...polyline, points: smoothPath(raw, false) };

  /** Heading change over each metre, away from the ends. */
  const stepsOf = (path: WorldPath) => {
    const steps: number[] = [];
    for (let d = 20; d < path.distanceM - 20; d += 1) {
      steps.push(wrap(poseAt(path, d + 1).heading - poseAt(path, d).heading));
    }
    return steps;
  };

  it('turns at a steady 1/R per metre on an arc of known radius (worked by hand)', () => {
    // On a circle of radius 100 m the heading turns 1/100 rad (0.57°) per metre.
    const steps = stepsOf(smooth);
    for (const x of steps) expect(Math.abs(Math.abs(x) - 1 / R)).toBeLessThan(0.0005); // ±5 %
  });

  it('the old polyline did not: it stood still and then jumped at each point', () => {
    const steps = stepsOf(polyline).map(Math.abs);
    expect(Math.max(...steps) - Math.min(...steps)).toBeGreaterThan(1 / R);
  });

  it('follows the circle, not the 10 m chords (which sag 12.5 cm)', () => {
    // Within 5 mm, except on the first and last 10 m: past the ends there is no
    // real neighbour, so the curve straightens a little (a few cm) there.
    for (let d = 10; d <= smooth.distanceM - 10; d += 0.5) {
      const p = pointAt(smooth, d);
      expect(Math.abs(Math.hypot(p.x, p.z) - R)).toBeLessThan(0.005);
    }
  });

  it('passes through every original point and keeps distances in route metres', () => {
    for (const p of raw) {
      const q = pointAt(smooth, p.d);
      expect(Math.hypot(q.x - p.x, q.z - p.z)).toBeLessThan(1e-6);
    }
    expect(smooth.points[0]?.d).toBe(0);
    expect(smooth.points.at(-1)?.d).toBeCloseTo(Math.PI * R, 6);
    expect(smooth.points.length).toBeGreaterThan((Math.PI * R) / 3);
  });

  it('leaves a straight road straight', () => {
    const pts = Array.from({ length: 11 }, (_, i) => ({
      lat: 43 + (i * 100) / 111_195,
      lon: -2,
      ele: 100 + i,
    }));
    const route = buildRoute(pts, { id: 's', name: 'S', source: 'builtin' });
    if (!route) throw new Error('route');
    const straight = projectRoute(route);
    const x0 = straight.points[0]?.x ?? 0;
    for (const p of straight.points) expect(Math.abs(p.x - x0)).toBeLessThan(1e-6);
    expect(poseAt(straight, 500).heading).toBeCloseTo(0, 6);
  });

  it('smooths a real route too (projectRoute), within what its 10 m resampling allows', () => {
    // The route resamples a GPX along its chords, so its points wobble by a few
    // centimetres; even so the turn rate stays within ±40 % of 1/R, where the
    // polyline swung by ±100 %.
    const M = 111_195;
    const lonPerM = 1 / (M * Math.cos((43 * Math.PI) / 180));
    const gpx = arcPoints(R).map((p) => ({ lat: 43 - p.z / M, lon: -2 + p.x * lonPerM, ele: 100 }));
    const route = buildRoute(gpx, { id: 'a', name: 'A', source: 'builtin' });
    if (!route) throw new Error('route');
    for (const x of stepsOf(projectRoute(route))) {
      expect(Math.abs(Math.abs(x) - 1 / R)).toBeLessThan(0.004);
    }
  });

  it('closes a loop whose ends are 20 m apart, with no kink where it joins', () => {
    // A circle of radius 100 m that stops 20 m short of where it started:
    // «closed» (ends under 30 m apart) but the last point does not repeat the first.
    const r = 100;
    const pts: PathPoint[] = [];
    for (let s = 0; s <= 2 * Math.PI * r - 20; s += 10) {
      const a = s / r;
      pts.push({ x: r * Math.cos(a), y: 0, z: r * Math.sin(a), d: s });
    }
    const loop = smoothPath(pts, true);
    const first = loop[0];
    const last = loop.at(-1);
    // The drawn road ends where it starts: no gap.
    expect(
      Math.hypot((last?.x ?? 0) - (first?.x ?? 0), (last?.z ?? 0) - (first?.z ?? 0)),
    ).toBeLessThan(1e-6);
    // Direction between consecutive samples turns smoothly all round, the
    // junction included (about 1/R per metre, never a jump).
    const dir = (i: number) => {
      const a = loop[i] ?? loop[0];
      const b = loop[i + 1] ?? loop[0];
      return Math.atan2((b?.x ?? 0) - (a?.x ?? 0), -((b?.z ?? 0) - (a?.z ?? 0)));
    };
    for (let i = 0; i < loop.length - 2; i++) {
      expect(Math.abs(wrap(dir(i + 1) - dir(i)))).toBeLessThan(0.03);
    }
    // And the junction itself, from the last segment into the first.
    expect(Math.abs(wrap(dir(0) - dir(loop.length - 2)))).toBeLessThan(0.03);
  });
});
