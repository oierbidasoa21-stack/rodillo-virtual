import { describe, expect, it } from 'vitest';
import { builtinRoutes } from '../route/examples';
import { buildRoute } from '../route/route';
import { chaseCamera, pointAt, poseAt, projectRoute } from './path';
import { farLevel } from './terrain';
import { horizonRing, scatterBushes, scatterRocks, scatterTrees } from './scenery';
import { centreDashes, edgeLines, ribbon, roadsidePosts } from './road';
import {
  GROUND_BELOW_ROAD_M,
  groundHeight,
  hills,
  indexRoad,
  roadNear,
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

describe('road details', () => {
  const path = projectRoute(northClimb());

  it('gives the road texture coordinates in metres', () => {
    const road = ribbon(path, 3);
    const uvs = road.uvs ?? new Float32Array();
    expect(uvs.length).toBe(path.points.length * 4);
    expect([uvs[0], uvs[2]]).toEqual([0, 6]); // 6 m across
    const last = path.points.length - 1;
    expect(uvs[last * 4 + 1]).toBeCloseTo(path.points[last]?.d ?? 0, 3); // v = distance
  });

  it('draws two edge lines inside the asphalt', () => {
    const lines = edgeLines(path);
    expect(lines.positions.length).toBe(path.points.length * 6 * 2);
    // Heading north, right is +x: the left line sits between -3 and -2.6 m from the centre.
    const cx = path.points[0]?.x ?? 0;
    const lx = (lines.positions[0] ?? 0) - cx;
    expect(lx).toBeLessThan(-2.6);
    expect(lx).toBeGreaterThan(-3);
    const maxIndex = Math.max(...lines.indices);
    expect(maxIndex).toBe(lines.positions.length / 3 - 1); // merged indices are rebased
  });

  it('puts a post every 50 m on each side, off the asphalt', () => {
    const posts = roadsidePosts(path);
    expect(posts.length).toBe(2 * Math.ceil((path.distanceM - 25) / 50));
    const p0 = pointAt(path, 25);
    const [a, b] = posts;
    expect(Math.abs((a?.x ?? 0) - p0.x)).toBeCloseTo(4.6, 1);
    expect((b?.x ?? 0) - p0.x).toBeCloseTo(4.6, 1);
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
    // About 0.6 m under the road at every point of the (dense, smoothed) path.
    for (const p of path.points) {
      const below = p.y - groundHeight(index, p.x, p.z);
      expect(below).toBeGreaterThan(GROUND_BELOW_ROAD_M - 0.15);
      expect(below).toBeLessThan(GROUND_BELOW_ROAD_M + 0.15);
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

  it('scatters the same trees every time, along the road but off it and its verge', () => {
    const a = scatterTrees(path, index);
    expect(a).toEqual(scatterTrees(path, index));
    expect(a.length).toBeGreaterThan(100); // ~1 km at 320 per km, minus clumping gaps
    for (const t of a) expect(roadNear(index, t.x, t.z).distM).toBeGreaterThan(9.9);
    expect(new Set(a.map((t) => t.kind))).toEqual(new Set([0, 1, 2]));
  });

  it('puts bushes and rocks beside the road, never on it', () => {
    for (const props of [scatterBushes(path, index), scatterRocks(path, index)]) {
      expect(props.length).toBeGreaterThan(30);
      for (const p of props) expect(roadNear(index, p.x, p.z).distM).toBeGreaterThan(6.9);
    }
  });

  it('levels the terrain off to the far level at its edge', () => {
    const grid = terrainGrid(path, index, { maxVertices: 5000 });
    const level = farLevel(path);
    for (let c = 0; c < grid.cols; c++) expect(grid.positions[c * 3 + 1]).toBeCloseTo(level, 3);
  });

  it('rings the terrain with flat land, then mountains, facing up', () => {
    const ring = horizonRing(path, 600, { segments: 64 });
    const level = farLevel(path);
    // First ring of vertices just under the terrain edge, the outermost high above it.
    expect(ring.positions[1]).toBeCloseTo(level - 3, 3);
    const above = Array.from(ring.heightAboveM);
    expect(Math.max(...above.slice(-64))).toBeGreaterThan(200);
    const [i0, i1, i2] = [ring.indices[0] ?? 0, ring.indices[1] ?? 0, ring.indices[2] ?? 0];
    expect(normalOf(ring.positions, i0, i1, i2)[1]).toBeGreaterThan(0);
  });
});
