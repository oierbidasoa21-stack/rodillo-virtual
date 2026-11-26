import { describe, expect, it } from 'vitest';
import { buildRoute } from '../route/route';
import { pointAt, projectRoute } from './path';
import { ROAD_HALF_WIDTH_M } from './road';
import { guardrails, placeSpectators } from './roadside';
import { indexRoad, roadNear } from './terrain';

const M_PER_DEG = 111_195;

/** Route from (north, east) offsets in metres, sampled every 20 m, with heights. */
function routeOf(legs: [north: number, east: number, ele: number][]) {
  const pts: { lat: number; lon: number; ele: number }[] = [];
  for (let i = 0; i < legs.length - 1; i++) {
    const [n0, e0, h0] = legs[i] ?? [0, 0, 0];
    const [n1, e1, h1] = legs[i + 1] ?? [0, 0, 0];
    const steps = Math.max(1, Math.round(Math.hypot(n1 - n0, e1 - e0) / 20));
    for (let k = 0; k < steps; k++) {
      const t = k / steps;
      pts.push({
        lat: 43 + (n0 + (n1 - n0) * t) / M_PER_DEG,
        lon: -2 + (e0 + (e1 - e0) * t) / (M_PER_DEG * Math.cos((43 * Math.PI) / 180)),
        ele: h0 + (h1 - h0) * t,
      });
    }
  }
  const last = legs[legs.length - 1] ?? [0, 0, 0];
  pts.push({
    lat: 43 + last[0] / M_PER_DEG,
    lon: -2 + last[1] / (M_PER_DEG * Math.cos((43 * Math.PI) / 180)),
    ele: last[2],
  });
  const route = buildRoute(pts, { id: 't', name: 'T', source: 'builtin' });
  if (!route) throw new Error('route');
  return projectRoute(route);
}

describe('spectators', () => {
  // 1 km flat, then 1 km at 8 %, all due north.
  const path = routeOf([
    [0, 0, 100],
    [1000, 0, 100],
    [2000, 0, 180],
  ]);
  const index = indexRoad(path);
  const crowd = placeSpectators(path, index);

  it('places the same crowd every time, off the road, facing it', () => {
    expect(crowd).toEqual(placeSpectators(path, index));
    expect(crowd.length).toBeGreaterThan(20);
    for (const s of crowd) {
      expect(roadNear(index, s.x, s.z).distM).toBeGreaterThan(ROAD_HALF_WIDTH_M + 0.7);
      // Facing vector for a heading (0 = north = -z): (sin h, -cos h).
      const c = pointAt(path, s.d);
      const dot = (c.x - s.x) * Math.sin(s.facing) - (c.z - s.z) * Math.cos(s.facing);
      expect(dot).toBeGreaterThan(0);
    }
  });

  it('gathers far more people on the climb than on the flat', () => {
    const between = (a: number, b: number) => crowd.filter((s) => s.d >= a && s.d < b).length;
    expect(between(1250, 1750)).toBeGreaterThan(3 * between(300, 800));
  });
});

describe('guardrails', () => {
  it('none on a straight road', () => {
    const straight = routeOf([
      [0, 0, 100],
      [1000, 0, 120],
    ]);
    expect(guardrails(straight).posts).toHaveLength(0);
  });

  it('on the outside of a sharp right-hand corner', () => {
    // North 500 m, then east 500 m: the outside of the corner is to the north-west.
    const path = routeOf([
      [0, 0, 100],
      [500, 0, 100],
      [500, 500, 100],
    ]);
    const { rail, posts } = guardrails(path);
    expect(posts.length).toBeGreaterThan(3);
    expect(rail.indices.length).toBe((posts.length - 1) * 6);
    const corner = pointAt(path, 500);
    // West of the northbound leg or north (−z) of the eastbound one, never inside the bend.
    for (const p of posts) expect(p.x < corner.x - 2 || p.z < corner.z - 2).toBe(true);
  });
});
