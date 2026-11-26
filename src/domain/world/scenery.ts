import { type WorldPath, pointAt, poseAt } from './path';
import type { MeshData } from './road';
import {
  type RoadIndex,
  VERGE_M,
  farLevel,
  groundHeight,
  hills,
  pathBounds,
  roadNear,
  rng,
  valueNoise,
} from './terrain';

/** Something placed on the ground beside the road. */
export interface Prop {
  x: number;
  y: number;
  z: number;
  /** Overall size in metres (height for trees, diameter for bushes and rocks). */
  sizeM: number;
  /** Rotation about the vertical, in radians, so copies do not look identical. */
  turn: number;
  /** Variant: trees 0 = conifer, 1 = round leafy tree, 2 = poplar; others 0. */
  kind: number;
}

/**
 * Props scattered along the road, at `perKm` per kilometre, between `minM` and
 * `maxM` from its centre line (more of them close to the road, where they are
 * seen), kept off any stretch of road and in clumps where `clump` noise is high.
 */
function scatterAlong(
  path: WorldPath,
  index: RoadIndex,
  o: { perKm: number; max: number; minM: number; maxM: number; seed: number; clump: number },
  make: (rand: () => number) => { sizeM: number; kind: number },
): Prop[] {
  const rand = rng(o.seed);
  const want = Math.min(o.max, Math.round((path.distanceM / 1000) * o.perKm));
  const out: Prop[] = [];
  for (let i = 0; i < want * 6 && out.length < want; i++) {
    const d = rand() * path.distanceM;
    const p = pointAt(path, d);
    const h = poseAt(path, d).heading;
    // Squared random: denser near the road.
    const off = (rand() < 0.5 ? -1 : 1) * (o.minM + (o.maxM - o.minM) * rand() ** 2);
    const x = p.x + Math.cos(h) * off;
    const z = p.z + Math.sin(h) * off;
    // Another stretch of road may pass here (hairpins, loops).
    if (roadNear(index, x, z).distM < o.minM) continue;
    if (o.clump > 0 && valueNoise(x / 90, z / 90, o.seed) < o.clump * (0.8 + rand() * 0.4)) {
      continue;
    }
    const { sizeM, kind } = make(rand);
    out.push({ x, y: groundHeight(index, x, z), z, sizeM, turn: rand() * Math.PI * 2, kind });
  }
  return out;
}

/** Trees along the road, in clumps: conifers, round leafy trees and tall poplars. */
export function scatterTrees(
  path: WorldPath,
  index: RoadIndex,
  opts: { perKm?: number; max?: number; seed?: number } = {},
): Prop[] {
  const { perKm = 320, max = 5000, seed = 42 } = opts;
  return scatterAlong(
    path,
    index,
    { perKm, max, minM: VERGE_M + 3, maxM: 320, seed, clump: 0.42 },
    (rand) => {
      const r = rand();
      const kind = r < 0.5 ? 0 : r < 0.85 ? 1 : 2;
      return { kind, sizeM: (kind === 2 ? 11 : 6) + rand() * 8 };
    },
  );
}

/** Low bushes, mostly close to the road. */
export function scatterBushes(path: WorldPath, index: RoadIndex, seed = 77): Prop[] {
  return scatterAlong(
    path,
    index,
    { perKm: 260, max: 4000, minM: VERGE_M + 0.5, maxM: 70, seed, clump: 0.3 },
    (rand) => ({ kind: 0, sizeM: 0.8 + rand() * 1.6 }),
  );
}

/** Grey rocks and boulders, small near the road and a few big ones further out. */
export function scatterRocks(path: WorldPath, index: RoadIndex, seed = 91): Prop[] {
  return scatterAlong(
    path,
    index,
    { perKm: 110, max: 2000, minM: VERGE_M, maxM: 90, seed, clump: 0 },
    (rand) => ({ kind: 0, sizeM: 0.3 + rand() ** 3 * 3 }),
  );
}

/** Ridged noise (sharp crests, soft valleys) in 0..1, a few octaves. */
function ridges(x: number, z: number): number {
  let sum = 0;
  let amp = 1;
  let freq = 1 / 1500;
  let norm = 0;
  for (let o = 0; o < 4; o++) {
    const n = 1 - Math.abs(valueNoise(x * freq, z * freq, 300 + o) * 2 - 1);
    sum += n * n * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2.1;
  }
  return sum / norm;
}

export interface HorizonMesh extends MeshData {
  /** Height above the far level per vertex, to colour it (grass, forest, rock, snow). */
  heightAboveM: Float32Array;
}

/**
 * Land beyond the terrain out to the horizon: flat (just under the terrain's
 * levelled edge) around it, then hills and a ring of mountains that fade into
 * the haze. A polar mesh around the route's centre.
 */
export function horizonRing(
  path: WorldPath,
  terrainMarginM: number,
  opts: { segments?: number; mountainsM?: number } = {},
): HorizonMesh {
  const { segments = 160, mountainsM = 700 } = opts;
  const b = pathBounds(path, terrainMarginM);
  const cx = (b.minX + b.maxX) / 2;
  const cz = (b.minZ + b.maxZ) / 2;
  const inner = Math.min(b.maxX - b.minX, b.maxZ - b.minZ) / 2 - 50;
  const outerTerrain = Math.hypot(b.maxX - b.minX, b.maxZ - b.minZ) / 2;
  const level = farLevel(path);
  // Radii: dense near the terrain, sparser far away.
  const radii = [inner, outerTerrain + 100];
  for (let r = outerTerrain + 250; r < outerTerrain + 6000; r *= 1.12) radii.push(r);
  radii.push(outerTerrain + 6000);
  const positions = new Float32Array(radii.length * segments * 3);
  const heightAboveM = new Float32Array(radii.length * segments);
  radii.forEach((r, ri) => {
    const rise = Math.min(1, Math.max(0, (r - outerTerrain - 100) / 2200));
    const hillsIn = Math.min(1, Math.max(0, (r - outerTerrain - 100) / 400));
    for (let s = 0; s < segments; s++) {
      const a = (s / segments) * Math.PI * 2;
      const x = cx + Math.cos(a) * r;
      const z = cz + Math.sin(a) * r;
      let above = -3; // just under the levelled terrain edge, hidden where they overlap
      if (r > outerTerrain + 100) {
        above =
          Math.max(0, hills(x, z, 60) + 20) * hillsIn +
          ridges(x, z) * mountainsM * rise * rise * (3 - 2 * rise);
      }
      const v = ri * segments + s;
      positions.set([x, level + above, z], v * 3);
      heightAboveM[v] = above;
    }
  });
  const indices = new Uint32Array((radii.length - 1) * segments * 6);
  let k = 0;
  for (let ri = 0; ri < radii.length - 1; ri++) {
    for (let s = 0; s < segments; s++) {
      const s1 = (s + 1) % segments;
      const a = ri * segments + s;
      const bb = ri * segments + s1;
      const c = (ri + 1) * segments + s;
      const d = (ri + 1) * segments + s1;
      // Angle grows from +x towards +z (clockwise seen from above): a → bb → c faces up.
      indices.set([a, bb, c, bb, d, c], k);
      k += 6;
    }
  }
  return { positions, indices, heightAboveM };
}
