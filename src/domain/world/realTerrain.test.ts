import { describe, expect, it } from 'vitest';
import { heightMosaic } from '../geo/heights';
import { TILE_SIZE, tileToLonLat } from '../geo/mercator';
import { toLocal } from '../geo/localFrame';
import type { Route } from '../route/route';
import { projectRoute } from './path';
import {
  REAL_BLEND_M,
  demWorldY,
  gpxOffsetM,
  median,
  realGroundHeight,
  realHeights,
  realHorizonGrid,
  realTerrainGrid,
} from './realTerrain';
import { GROUND_BELOW_ROAD_M, VERGE_M, groundHeight, indexRoad } from './terrain';

// One zoom-12 tile (x 2048, y 1510) of flat ground at 1000 m: easy to check by hand.
const flat = (h: number) => new Float32Array(TILE_SIZE * TILE_SIZE).fill(h);
const near = heightMosaic(12, [[{ z: 12, x: 2048, y: 1510 }, flat(1000)]]);
// The tile spans lon 0…0.088 and lat ≈ 42.62…42.68; an invented straight road inside it.
const a = tileToLonLat(2048.3, 1510.5, 12);
const b = tileToLonLat(2048.6, 1510.5, 12);
const N = 40;
const route: Route = {
  id: 'prueba',
  name: 'Prueba',
  source: 'gpx',
  distanceM: 0,
  ascentM: 0,
  descentM: 0,
  maxGrade: 0,
  points: Array.from({ length: N + 1 }, (_, i) => ({
    lat: a.lat,
    lon: a.lon + ((b.lon - a.lon) * i) / N,
    // The GPS reads 4 m high, with one wild point (a tunnel) the median ignores.
    ele: i === 20 ? 1300 : 1004,
    distanceM: 0,
  })),
};
// Distances along the road, from the local frame (straight east).
const frame = { lat0: a.lat, lon0: (a.lon + b.lon) / 2 };
route.points.forEach((p) => {
  p.distanceM = toLocal(frame, p.lon, p.lat).x - toLocal(frame, a.lon, a.lat).x;
});
route.distanceM = route.points.at(-1)?.distanceM ?? 0;

describe('real terrain', () => {
  it('takes the middle value as the median', () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 3, 2])).toBe(2.5);
    expect(median([])).toBeNull();
  });

  it('measures how far the GPX is above the elevation model (hand-checked)', () => {
    // 40 points at 1004 − 1000 = 4 m and one at 300 m: the median is 4.
    expect(gpxOffsetM(route.points, near)).toBe(4);
    // No tile under the route: no offset, so no real terrain.
    expect(gpxOffsetM([{ lat: 10, lon: 10, ele: 0 }], near)).toBeNull();
    expect(
      realHeights({ points: [{ lat: 10, lon: 10, ele: 0, distanceM: 0 }] }, near, null),
    ).toBeNull();
  });

  const rh = realHeights(route, near, null)!;
  const path = projectRoute(route);
  const index = indexRoad(path);

  it('puts the model at the GPX height in world metres', () => {
    // World y = model + offset − lowest GPX = 1000 + 4 − 1004 = 0.
    expect(demWorldY(rh, 0, 300)).toBeCloseTo(0, 6);
    // Outside the tile there is no data.
    expect(demWorldY(rh, 0, 1e6)).toBeNull();
  });

  it('follows the road beside it and the real relief beyond the blend', () => {
    // A quarter along, away from the wild point: the road is flat there.
    const mid = path.points[Math.floor(path.points.length / 4)]!;
    // On the verge: just under the road.
    const roadY = mid.y;
    expect(realGroundHeight(rh, index, mid.x, mid.z + VERGE_M - 1)).toBeCloseTo(
      roadY - GROUND_BELOW_ROAD_M,
      1,
    );
    // Past the blend: exactly the model (0 m here).
    expect(realGroundHeight(rh, index, mid.x, mid.z + VERGE_M + REAL_BLEND_M + 50)).toBeCloseTo(
      0,
      6,
    );
  });

  it('falls back to the usual ground where no tile covers the spot', () => {
    const x = 0;
    const z = -1e5;
    expect(realGroundHeight(rh, index, x, z)).toBe(groundHeight(index, x, z));
  });

  it('builds the near grid within its vertex budget', () => {
    const grid = realTerrainGrid(path, index, rh, { marginM: 500, maxVertices: 5000 });
    expect(grid.cols * grid.rows).toBeLessThanOrEqual(5000 * 1.1);
    expect(grid.positions.length).toBe(grid.cols * grid.rows * 3);
    expect(grid.indices.length).toBe((grid.cols - 1) * (grid.rows - 1) * 6);
  });

  it('sinks the horizon ground under the near terrain', () => {
    const nearGrid = realTerrainGrid(path, index, rh, { marginM: 500, maxVertices: 2000 });
    const far = realHorizonGrid(path, { ...rh, far: near }, nearGrid.bounds, {
      marginM: 3000,
      cells: 40,
    });
    const ys: number[] = [];
    for (let i = 1; i < far.positions.length; i += 3) ys.push(far.positions[i]!);
    // Inside the near area: 40 m down; outside: 2 m under the model (0 m).
    expect(Math.min(...ys)).toBeCloseTo(-40, 6);
    expect(Math.max(...ys)).toBeCloseTo(-2, 6);
  });
});
