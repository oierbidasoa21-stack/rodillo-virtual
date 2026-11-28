import { extent } from '../extent';
import { type HeightMosaic, sampleHeight } from '../geo/heights';
import { type LocalFrame, frameOf, toLonLat } from '../geo/localFrame';
import { LANDSCAPE } from '../geo/landscape';
import type { Route } from '../route/route';
import type { WorldPath } from './path';
import type { MeshData } from './road';
import {
  type Bounds,
  GROUND_BELOW_ROAD_M,
  type RoadIndex,
  VERGE_M,
  groundHeight,
  pathBounds,
  roadNear,
} from './terrain';

/**
 * Real heights for a route's world: the decoded height tiles (near and, for
 * the horizon, far), the local frame the road was projected with, and the
 * offset that puts the elevation model at the GPX's height.
 */
export interface RealHeights {
  near: HeightMosaic;
  far: HeightMosaic | null;
  frame: LocalFrame;
  /** The road's lowest GPX elevation: world y = elevation − minEle. */
  minEle: number;
  /** Median of (GPX elevation − model elevation) along the route, in metres. */
  offsetM: number;
}

/** Real ground reaches its own height this far from the road (from the verge). */
export const REAL_BLEND_M = 60;
/** Far ground is sunk this much where the near terrain covers it, so they never fight. */
const FAR_UNDER_NEAR_M = 40;

/** Median of some numbers (the middle one, or the mean of the two middle ones). */
export function median(values: readonly number[]): number | null {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? (s[m] ?? null) : ((s[m - 1] ?? 0) + (s[m] ?? 0)) / 2;
}

/**
 * How much higher the GPX is than the elevation model along the route. GPS
 * altitude is often a constant few metres off; the median ignores the odd
 * point on a bridge or in a cut. Null if the model covers none of the route.
 */
export function gpxOffsetM(
  points: readonly { lat: number; lon: number; ele: number }[],
  mosaic: HeightMosaic,
): number | null {
  const diffs: number[] = [];
  for (const p of points) {
    const h = sampleHeight(mosaic, p.lon, p.lat);
    if (h !== null) diffs.push(p.ele - h);
  }
  return median(diffs);
}

/** Real heights for a route, or null if the near tiles do not cover it at all. */
export function realHeights(
  route: Pick<Route, 'points'>,
  near: HeightMosaic,
  far: HeightMosaic | null,
): RealHeights | null {
  const offsetM = gpxOffsetM(route.points, near);
  if (offsetM === null) return null;
  return {
    near,
    far,
    frame: frameOf(route.points),
    minEle: extent(route.points.map((p) => p.ele)).min,
    offsetM,
  };
}

/** World height of the real ground at (x, z), near tiles first; null where none cover it. */
export function demWorldY(rh: RealHeights, x: number, z: number, farOnly = false): number | null {
  const { lon, lat } = toLonLat(rh.frame, x, z);
  const h =
    (farOnly ? null : sampleHeight(rh.near, lon, lat)) ??
    (rh.far ? sampleHeight(rh.far, lon, lat) : null);
  return h === null ? null : h + rh.offsetM - rh.minEle;
}

const smooth = (t: number) => t * t * (3 - 2 * t);

/**
 * Ground height with real relief: just under the road next to it (as always),
 * then the real ground from REAL_BLEND_M on. Where no tile covers the spot, the
 * usual ground: nothing is made up to fill a gap in the data.
 */
export function realGroundHeight(rh: RealHeights, index: RoadIndex, x: number, z: number): number {
  const dem = demWorldY(rh, x, z);
  if (dem === null) return groundHeight(index, x, z);
  const { distM, roadY } = roadNear(index, x, z);
  const t = smooth(Math.min(1, Math.max(0, (distM - VERGE_M) / REAL_BLEND_M)));
  return roadY - GROUND_BELOW_ROAD_M + (dem - (roadY - GROUND_BELOW_ROAD_M)) * t;
}

function gridIndices(cols: number, rows: number): Uint32Array {
  const indices = new Uint32Array((cols - 1) * (rows - 1) * 6);
  let k = 0;
  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols - 1; c++) {
      const a = r * cols + c;
      const b = a + 1;
      const cc = a + cols;
      const d = cc + 1;
      // Face up (+y), as in terrainGrid.
      indices.set([a, cc, b, b, cc, d], k);
      k += 6;
    }
  }
  return indices;
}

export type RealGrid = MeshData & { cellM: number; cols: number; rows: number; bounds: Bounds };

/**
 * Real ground near the route: a regular grid up to `marginM` from it, with at
 * most `maxVertices` vertices (cells grow on long routes), following the road
 * beside it and the real relief beyond.
 */
export function realTerrainGrid(
  path: WorldPath,
  index: RoadIndex,
  rh: RealHeights,
  opts: { marginM?: number; maxVertices?: number; minCellM?: number } = {},
): RealGrid {
  const { marginM = LANDSCAPE.nearMarginM, maxVertices = 120_000, minCellM = 15 } = opts;
  const b = pathBounds(path, marginM);
  const w = b.maxX - b.minX;
  const h = b.maxZ - b.minZ;
  const cellM = Math.max(minCellM, Math.sqrt((w * h) / maxVertices));
  const cols = Math.max(2, Math.ceil(w / cellM) + 1);
  const rows = Math.max(2, Math.ceil(h / cellM) + 1);
  const positions = new Float32Array(cols * rows * 3);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = b.minX + c * cellM;
      const z = b.minZ + r * cellM;
      positions.set([x, realGroundHeight(rh, index, x, z), z], (r * cols + c) * 3);
    }
  }
  return { positions, indices: gridIndices(cols, rows), cellM, cols, rows, bounds: b };
}

/**
 * Real ground from the near terrain out to the horizon (`marginM` from the
 * route), coarse, from the far tiles. Under the near terrain it is sunk out of
 * sight; where no far tile covers a spot it settles to the route's lowest point.
 */
export function realHorizonGrid(
  path: WorldPath,
  rh: RealHeights,
  near: Bounds,
  opts: { marginM?: number; cells?: number } = {},
): RealGrid {
  const { marginM = LANDSCAPE.farMarginM, cells = 160 } = opts;
  const b = pathBounds(path, marginM);
  const cellM = Math.max(b.maxX - b.minX, b.maxZ - b.minZ) / cells;
  const cols = Math.max(2, Math.ceil((b.maxX - b.minX) / cellM) + 1);
  const rows = Math.max(2, Math.ceil((b.maxZ - b.minZ) / cellM) + 1);
  const positions = new Float32Array(cols * rows * 3);
  // Inside the near terrain (with one cell to spare) the far ground hides below it.
  const inside = (x: number, z: number) =>
    x > near.minX + cellM &&
    x < near.maxX - cellM &&
    z > near.minZ + cellM &&
    z < near.maxZ - cellM;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = b.minX + c * cellM;
      const z = b.minZ + r * cellM;
      const y = demWorldY(rh, x, z, true) ?? -GROUND_BELOW_ROAD_M;
      positions.set([x, inside(x, z) ? y - FAR_UNDER_NEAR_M : y - 2, z], (r * cols + c) * 3);
    }
  }
  return { positions, indices: gridIndices(cols, rows), cellM, cols, rows, bounds: b };
}
