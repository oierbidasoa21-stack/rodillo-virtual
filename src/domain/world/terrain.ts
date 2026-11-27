import type { WorldPath } from './path';
import { extent } from '../extent';
import { type MeshData, ROAD_HALF_WIDTH_M } from './road';

/** Deterministic pseudo-random number in [0, 1) for integer lattice coordinates. */
function hash2(ix: number, iz: number, seed: number): number {
  let h = Math.imul(ix, 374761393) ^ Math.imul(iz, 668265263) ^ Math.imul(seed, 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

const smooth = (t: number) => t * t * (3 - 2 * t);

/** Smooth value noise in [0, 1), period-free. */
export function valueNoise(x: number, z: number, seed = 1): number {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = smooth(x - ix);
  const fz = smooth(z - iz);
  const a = hash2(ix, iz, seed);
  const b = hash2(ix + 1, iz, seed);
  const c = hash2(ix, iz + 1, seed);
  const d = hash2(ix + 1, iz + 1, seed);
  return a + (b - a) * fx + (c - a) * fz + (a - b - c + d) * fx * fz;
}

/** Rolling hills: three octaves of value noise, in metres, roughly ±`amplitudeM`. */
export function hills(x: number, z: number, amplitudeM = 30, seed = 7): number {
  let sum = 0;
  let amp = 1;
  let freq = 1 / 420;
  let norm = 0;
  for (let o = 0; o < 3; o++) {
    sum += (valueNoise(x * freq, z * freq, seed + o) - 0.5) * 2 * amp;
    norm += amp;
    amp *= 0.45;
    freq *= 2.3;
  }
  return (sum / norm) * amplitudeM;
}

/** Road points bucketed on a grid, to find the road near any spot quickly. */
export interface RoadIndex {
  cellM: number;
  cells: Map<string, { x: number; y: number; z: number }[]>;
  /** Coarse height field filled out from the road, for ground far from it. */
  far: { minX: number; minZ: number; cellM: number; cols: number; rows: number; y: Float64Array };
}

/** Road points closer than this blend by distance; farther ground follows the far field. */
const NEAR_M = 200;
const FAR_CELL_M = 100;
const FAR_MARGIN_M = 2000;

/** Road heights spread over a coarse grid: cells on the road keep their mean, the rest are filled outwards and smoothed. */
function farField(path: WorldPath): RoadIndex['far'] {
  const ex = extent(path.points.map((p) => p.x));
  const ez = extent(path.points.map((p) => p.z));
  const minX = ex.min - FAR_MARGIN_M;
  const minZ = ez.min - FAR_MARGIN_M;
  const cols = Math.ceil((ex.max + FAR_MARGIN_M - minX) / FAR_CELL_M) + 1;
  const rows = Math.ceil((ez.max + FAR_MARGIN_M - minZ) / FAR_CELL_M) + 1;
  const sum = new Float64Array(cols * rows);
  const count = new Float64Array(cols * rows);
  for (const p of path.points) {
    const c = Math.round((p.x - minX) / FAR_CELL_M);
    const r = Math.round((p.z - minZ) / FAR_CELL_M);
    sum[r * cols + c] = (sum[r * cols + c] ?? 0) + p.y;
    count[r * cols + c] = (count[r * cols + c] ?? 0) + 1;
  }
  let y = new Float64Array(cols * rows);
  const known = new Uint8Array(cols * rows);
  let frontier: number[] = [];
  for (let k = 0; k < y.length; k++) {
    if ((count[k] ?? 0) > 0) {
      y[k] = (sum[k] ?? 0) / (count[k] ?? 1);
      known[k] = 1;
      frontier.push(k);
    }
  }
  // Fill outwards, ring by ring, each new cell taking the mean of its known neighbours.
  while (frontier.length) {
    const next: number[] = [];
    const add = new Map<number, number[]>();
    for (const k of frontier) {
      const r = Math.floor(k / cols);
      const c = k % cols;
      for (const [dr, dc] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ] as const) {
        const rr = r + dr;
        const cc = c + dc;
        if (rr < 0 || cc < 0 || rr >= rows || cc >= cols) continue;
        const n = rr * cols + cc;
        if (known[n]) continue;
        const list = add.get(n);
        if (list) list.push(y[k] ?? 0);
        else add.set(n, [y[k] ?? 0]);
      }
    }
    for (const [n, vals] of add) {
      y[n] = vals.reduce((a, b) => a + b, 0) / vals.length;
      known[n] = 1;
      next.push(n);
    }
    frontier = next;
  }
  // Smooth so valleys and slopes are gentle.
  for (let pass = 0; pass < 4; pass++) {
    const out = new Float64Array(y.length);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let s2 = 0;
        let n = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const rr = r + dr;
            const cc = c + dc;
            if (rr < 0 || cc < 0 || rr >= rows || cc >= cols) continue;
            s2 += y[rr * cols + cc] ?? 0;
            n++;
          }
        }
        out[r * cols + c] = s2 / n;
      }
    }
    y = out;
  }
  return { minX, minZ, cellM: FAR_CELL_M, cols, rows, y };
}

/** Far-field height at (x, z), bilinear, clamped at the edges. */
function farHeight(far: RoadIndex['far'], x: number, z: number): number {
  const fx = Math.min(far.cols - 1.001, Math.max(0, (x - far.minX) / far.cellM));
  const fz = Math.min(far.rows - 1.001, Math.max(0, (z - far.minZ) / far.cellM));
  const c = Math.floor(fx);
  const r = Math.floor(fz);
  const tx = fx - c;
  const tz = fz - r;
  const at = (rr: number, cc: number) => far.y[rr * far.cols + cc] ?? 0;
  const top = at(r, c) + (at(r, c + 1) - at(r, c)) * tx;
  const bottom = at(r + 1, c) + (at(r + 1, c + 1) - at(r + 1, c)) * tx;
  return top + (bottom - top) * tz;
}

/**
 * The ground follows the road through one point every this many metres. The
 * smoothed path is much denser (every metre), but for the ground that only
 * costs time and lets neighbours outweigh the point under the road.
 */
const ROAD_INDEX_STEP_M = 10;

export function indexRoad(path: WorldPath, cellM = 100): RoadIndex {
  const cells = new Map<string, { x: number; y: number; z: number }[]>();
  const sampled = path.points.filter(
    (p, i, all) =>
      i === 0 ||
      i === all.length - 1 ||
      Math.floor(p.d / ROAD_INDEX_STEP_M) !== Math.floor((all[i - 1]?.d ?? 0) / ROAD_INDEX_STEP_M),
  );
  for (const p of sampled) {
    const key = `${Math.floor(p.x / cellM)},${Math.floor(p.z / cellM)}`;
    const list = cells.get(key);
    if (list) list.push(p);
    else cells.set(key, [p]);
  }
  return { cellM, cells, far: farField(path) };
}

/**
 * Distance to the nearest road point and the height the ground follows here:
 * the nearby road, weighted by distance, fading smoothly into the far field.
 */
export function roadNear(index: RoadIndex, x: number, z: number): { distM: number; roadY: number } {
  const cx = Math.floor(x / index.cellM);
  const cz = Math.floor(z / index.cellM);
  const reach = Math.ceil(NEAR_M / index.cellM);
  let best = Infinity;
  let wSum = 0;
  let ySum = 0;
  for (let i = -reach; i <= reach; i++) {
    for (let j = -reach; j <= reach; j++) {
      for (const p of index.cells.get(`${cx + i},${cz + j}`) ?? []) {
        const d2 = (p.x - x) ** 2 + (p.z - z) ** 2;
        best = Math.min(best, d2);
        if (d2 >= NEAR_M * NEAR_M) continue;
        // 1/(d² + 5²)²: the nearest stretch of road decides; another road 50 m away (a
        // hairpin at another height) barely counts, so it cannot bury this one. The
        // (1 - d²/R²)² factor brings it smoothly to zero at NEAR_M, so no steps.
        const fade = (1 - d2 / (NEAR_M * NEAR_M)) ** 2;
        const w = fade / (d2 + 25) ** 2;
        wSum += w;
        ySum += w * p.y;
      }
    }
  }
  // The far field counts like one road point at ~NEAR_M/2: it takes over away from roads.
  const farW = 1 / ((NEAR_M / 2) ** 2 + 25) ** 2;
  const farY = farHeight(index.far, x, z);
  return {
    distM: Math.sqrt(best),
    roadY: (ySum + farW * farY) / (wSum + farW),
  };
}

/** The flat strip either side of the road where the ground is just under it. */
export const VERGE_M = ROAD_HALF_WIDTH_M + 4;
/** Hills reach full height this far from the road. */
const BLEND_M = 140;
/** Ground sits this much below the road surface next to it. */
export const GROUND_BELOW_ROAD_M = 0.6;

/**
 * Ground height at (x, z): just under the road next to it, rising into rolling
 * hills away from it. Far from any road it follows the far field.
 */
export function groundHeight(index: RoadIndex, x: number, z: number): number {
  const { distM, roadY } = roadNear(index, x, z);
  const t = Math.min(1, Math.max(0, (distM - VERGE_M) / (BLEND_M - VERGE_M)));
  return roadY - GROUND_BELOW_ROAD_M + hills(x, z) * smooth(t);
}

export interface Bounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export function pathBounds(path: WorldPath, marginM: number): Bounds {
  const ex = extent(path.points.map((p) => p.x));
  const ez = extent(path.points.map((p) => p.z));
  return {
    minX: ex.min - marginM,
    maxX: ex.max + marginM,
    minZ: ez.min - marginM,
    maxZ: ez.max + marginM,
  };
}

/** Ground beyond the route's bounding box. */
export const TERRAIN_MARGIN_M = 600;

/** How far from the terrain edge the ground starts to level off to the horizon. */
export const EDGE_BLEND_M = 400;

/** The level the ground settles to at the edge of the terrain, where the horizon begins. */
export function farLevel(path: WorldPath): number {
  const ys = path.points.map((p) => p.y);
  return ys.reduce((s, y) => s + y, 0) / Math.max(1, ys.length) - GROUND_BELOW_ROAD_M;
}

/** Weight (0 at the edge of `b`, 1 inside) that levels the terrain off near its edge. */
export function edgeWeight(b: Bounds, x: number, z: number): number {
  const e = Math.min(x - b.minX, b.maxX - x, z - b.minZ, b.maxZ - z);
  const t = Math.min(1, Math.max(0, e / EDGE_BLEND_M));
  return t * t * (3 - 2 * t);
}

/**
 * Ground as a regular grid over the route plus a margin, at most `maxVertices`
 * vertices (cells grow on long routes to keep it light on a laptop).
 */
export function terrainGrid(
  path: WorldPath,
  index: RoadIndex,
  opts: { marginM?: number; maxVertices?: number; minCellM?: number } = {},
): MeshData & { cellM: number; cols: number; rows: number } {
  const { marginM = TERRAIN_MARGIN_M, maxVertices = 60_000, minCellM = 12 } = opts;
  const b = pathBounds(path, marginM);
  const w = b.maxX - b.minX;
  const h = b.maxZ - b.minZ;
  const cellM = Math.max(minCellM, Math.sqrt((w * h) / maxVertices));
  const cols = Math.max(2, Math.ceil(w / cellM) + 1);
  const rows = Math.max(2, Math.ceil(h / cellM) + 1);
  const positions = new Float32Array(cols * rows * 3);
  const level = farLevel(path);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = b.minX + c * cellM;
      const z = b.minZ + r * cellM;
      // Level off towards the edge so it meets the horizon ring seamlessly.
      const y = level + (groundHeight(index, x, z) - level) * edgeWeight(b, x, z);
      positions.set([x, y, z], (r * cols + c) * 3);
    }
  }
  const indices = new Uint32Array((cols - 1) * (rows - 1) * 6);
  let k = 0;
  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols - 1; c++) {
      const a = r * cols + c; // north-west… (row grows south)
      const bb = a + 1; // east
      const cc = a + cols; // south
      const d = cc + 1;
      // Face up (+y): a → cc → bb, bb → cc → d.
      indices.set([a, cc, bb, bb, cc, d], k);
      k += 6;
    }
  }
  return { positions, indices, cellM, cols, rows };
}

/** Small deterministic random generator (mulberry32). */
export function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
