import { describe, expect, it } from 'vitest';
import { builtinRoutes } from '../route/examples';
import { buildRoute } from '../route/route';
import { chaseCamera, pointAt, poseAt, projectRoute } from './path';
import { centreDashes, ribbon } from './road';
import {
  GROUND_BELOW_ROAD_M,
  groundHeight,
  hills,
  indexRoad,
  roadNear,
  scatterTrees,
  terrainGrid,
  valueNoise,
} from './terrain';

/** 1 km due north, climbing 50 m. One degree of latitude ≈ 111.2 km. */
function northClimb() {
  const pts = Array.from({ length: 11 }, (_, i) => ({
    lat: 43 + (i * 0.1) / 111.195,
    lon: -2,
    ele: 100 + i * 5,
  }));
  const route = buildRoute(pts, { id: 'n', name: 'N', source: 'builtin' });
  if (!route) throw new Error('route');
  return route;
}

function normalOf(pos: Float32Array, a: number, b: number, c: number) {
  const v = (i: number) => [pos[i * 3] ?? 0, pos[i * 3 + 1] ?? 0, pos[i * 3 + 2] ?? 0];
  const [ax, ay, az] = v(a) as [number, number, number];
  const [bx, by, bz] = v(b) as [number, number, number];
  const [cx, cy, cz] = v(c) as [number, number, number];
  const u = [bx - ax, by - ay, bz - az] as const;
  const w = [cx - ax, cy - ay, cz - az] as const;
  return [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
}

describe('projectRoute', () => {
  const path = projectRoute(northClimb());

  it('lays a 1 km climb due north along -z, heights from the lowest point', () => {
    const first = path.points[0];
    const last = path.points.at(-1);
    expect(last && first && first.z - last.z).toBeCloseTo(1000, -1);
    expect(last && first && Math.abs(last.x - first.x)).toBeLessThan(0.5);
    expect(first?.y).toBeCloseTo(0, 6);
    expect(last?.y).toBeCloseTo(50, 0);
    expect(path.closed).toBe(false);
  });

  it('finds positions by distance and extrapolates behind the start', () => {
    const mid = pointAt(path, 500);
    expect(mid.y).toBeCloseTo(25, 0);
    const behind = pointAt(path, -10);
    expect(behind.z).toBeGreaterThan(path.points[0]?.z ?? 0); // south of the start
  });

  it('faces north with a 5 % pitch, and the camera sits behind and above', () => {
    const pose = poseAt(path, 500);
    expect(pose.heading).toBeCloseTo(0, 2);
    expect(Math.tan(pose.pitch)).toBeCloseTo(0.05, 2);
    const cam = chaseCamera(path, 500);
    expect(cam.position.z).toBeGreaterThan(pose.position.z);
    expect(cam.position.y).toBeGreaterThan(pose.position.y + 2);
    expect(cam.target.z).toBeLessThan(pose.position.z);
  });

  it('closes the loop of the reservoir route and wraps around it', () => {
    const loop = builtinRoutes().find((r) => r.name === 'Vuelta al Embalse');
    if (!loop) throw new Error('route');
    const p = projectRoute(loop);
    expect(p.closed).toBe(true);
    const a = pointAt(p, 100);
    const b = pointAt(p, 100 + loop.distanceM);
    expect([b.x, b.z]).toEqual([a.x, a.z]);
  });
});

describe('road meshes', () => {
  const path = projectRoute(northClimb());
  const road = ribbon(path, 3);

  it('is 6 m wide, east–west across a road heading north, faces up', () => {
    expect(road.positions.length).toBe(path.points.length * 6);
    const lx = road.positions[0] ?? 0;
    const rx = road.positions[3] ?? 0;
    expect(rx - lx).toBeCloseTo(6, 3); // right of north is east (+x)
    const [i0, i1, i2] = [road.indices[0] ?? 0, road.indices[1] ?? 0, road.indices[2] ?? 0];
    expect(normalOf(road.positions, i0, i1, i2)[1]).toBeGreaterThan(0);
  });

  it('dashes the centre line, also facing up', () => {
    const dashes = centreDashes(path);
    // ~1 km: a dash starts every 12 m while a whole 4 m dash still fits (83 or 84 of them).
    expect(path.distanceM).toBeCloseTo(1000, -1);
    expect(dashes.indices.length / 6).toBe(Math.floor((path.distanceM - 4) / 12) + 1);
    const first = [dashes.positions[2] ?? 0, dashes.positions[8] ?? 0];
    expect((first[0] ?? 0) - (first[1] ?? 0)).toBeCloseTo(4, 1); // 4 m long, heading north
    const [i0, i1, i2] = [dashes.indices[0] ?? 0, dashes.indices[1] ?? 0, dashes.indices[2] ?? 0];
    expect(normalOf(dashes.positions, i0, i1, i2)[1]).toBeGreaterThan(0);
  });
});

describe('terrain', () => {
  const path = projectRoute(northClimb());
  const index = indexRoad(path);

  it('noise is smooth and repeatable', () => {
    expect(valueNoise(3.2, 7.9)).toBe(valueNoise(3.2, 7.9));
    expect(Math.abs(valueNoise(3.2, 7.9) - valueNoise(3.21, 7.9))).toBeLessThan(0.02);
    const samples = Array.from({ length: 200 }, (_, i) => hills(i * 37, i * 53));
    expect(Math.max(...samples)).toBeLessThanOrEqual(30);
    expect(Math.max(...samples) - Math.min(...samples)).toBeGreaterThan(10);
  });

  it('keeps the ground just under the road all along it', () => {
    for (const p of path.points) {
      expect(groundHeight(index, p.x, p.z)).toBeCloseTo(p.y - GROUND_BELOW_ROAD_M, 1);
    }
    expect(roadNear(index, 50, -500).distM).toBeCloseTo(50, 0);
  });

  it('a hairpin 50 m away at another height does not lift the ground over the road', () => {
    // Two parallel roads 50 m apart, the second 20 m higher (like a hairpin).
    const pts = [
      ...Array.from({ length: 31 }, (_, i) => ({
        lat: 43 + (i * 0.01) / 111.195,
        lon: -2,
        ele: 100,
      })),
      ...Array.from({ length: 31 }, (_, i) => ({
        lat: 43 + ((30 - i) * 0.01) / 111.195,
        lon: -2 + 0.05 / 81.4,
        ele: 120,
      })),
    ];
    const route = buildRoute(pts, { id: 'h', name: 'H', source: 'builtin' });
    if (!route) throw new Error('route');
    const p = projectRoute(route);
    const idx = indexRoad(p);
    const low = p.points[15];
    if (!low) throw new Error('point');
    expect(groundHeight(idx, low.x, low.z)).toBeLessThan(low.y);
  });

  it('has no cliffs: walking 600 m away from a mountain road, no 5 m step climbs more than 4 m', () => {
    const route = builtinRoutes().find((r) => r.name.startsWith('Puerto'));
    if (!route) throw new Error('route');
    const p = projectRoute(route);
    const idx = indexRoad(p);
    for (const d of [100, 3000, 6000]) {
      const pose = poseAt(p, d);
      const rx = Math.cos(pose.heading);
      const rz = Math.sin(pose.heading);
      for (const side of [-1, 1]) {
        let prev = groundHeight(idx, pose.position.x, pose.position.z);
        for (let o = 5; o <= 600; o += 5) {
          const h = groundHeight(
            idx,
            pose.position.x + side * rx * o,
            pose.position.z + side * rz * o,
          );
          expect(Math.abs(h - prev)).toBeLessThan(4);
          prev = h;
        }
      }
    }
  });

  it('builds a grid within the vertex budget, facing up', () => {
    const grid = terrainGrid(path, index, { maxVertices: 5000 });
    expect(grid.cols * grid.rows).toBeLessThanOrEqual(5600);
    expect(grid.positions.length).toBe(grid.cols * grid.rows * 3);
    const [i0, i1, i2] = [grid.indices[0] ?? 0, grid.indices[1] ?? 0, grid.indices[2] ?? 0];
    expect(normalOf(grid.positions, i0, i1, i2)[1]).toBeGreaterThan(0);
  });

  it('scatters the same trees every time, off the road and its verge', () => {
    const a = scatterTrees(path, index, { maxTrees: 300 });
    const b = scatterTrees(path, index, { maxTrees: 300 });
    expect(a).toEqual(b);
    expect(a.length).toBeGreaterThan(50);
    for (const t of a) expect(roadNear(index, t.x, t.z).distM).toBeGreaterThan(9);
  });
});
