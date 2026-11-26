import { type WorldPath, pointAt, poseAt } from './path';
import { type MeshData, ROAD_HALF_WIDTH_M, type RoadsidePost } from './road';
import { type RoadIndex, groundHeight, rng, roadNear, valueNoise } from './terrain';

/** Wraps an angle difference to (-π, π]. */
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

/** Grade (rise over run) of the road around `d`. */
export function gradeAt(path: WorldPath, d: number, spanM = 15): number {
  return (pointAt(path, d + spanM).y - pointAt(path, d - spanM).y) / (2 * spanM);
}

/** How fast the road turns at `d`, in rad/m: positive to the right, 1 / radius. */
export function turnAt(path: WorldPath, d: number, spanM = 8): number {
  return wrap(poseAt(path, d + spanM).heading - poseAt(path, d - spanM).heading) / (2 * spanM);
}

/** A spectator beside the road. */
export interface Spectator {
  x: number;
  y: number;
  z: number;
  /** Heading the person faces (0 = north): towards the road. */
  facing: number;
  heightM: number;
  /** Index into a palette of shirt colours. */
  shirt: number;
  /** 0..2π, so they do not all move in step. */
  phase: number;
  /** Distance along the road they stand at, to cheer when the rider is near. */
  d: number;
}

export const SHIRT_COLOURS = 8;

/**
 * Spectators along the road, the way crowds gather: many on climbs, on corners
 * and around the start and finish, few on flat straights. In small groups, on
 * the verge, facing the road. Same route, same crowd.
 */
export function placeSpectators(
  path: WorldPath,
  index: RoadIndex,
  opts: { max?: number; seed?: number } = {},
): Spectator[] {
  const { max = 1400, seed = 5 } = opts;
  const rand = rng(seed);
  const out: Spectator[] = [];
  const total = path.distanceM;
  for (let d = 20; d < total - 5 && out.length < max; d += 7) {
    const climb = Math.max(0, gradeAt(path, d) - 0.03) * 7;
    const corner = Math.min(1, Math.abs(turnAt(path, d)) * 50) * 0.5;
    const ends = d < 200 || d > total - 200 ? 0.9 : 0;
    // Crowds come and go along the road.
    const crowd = valueNoise(d / 150, 0.5, seed) > 0.35 ? 1 : 0.15;
    const p = (0.03 + climb + corner + ends) * crowd;
    for (const side of [-1, 1]) {
      if (rand() > p) continue;
      const group = 1 + Math.floor(rand() * 4);
      const out0 = ROAD_HALF_WIDTH_M + 1 + rand() * 2.5;
      for (let g = 0; g < group && out.length < max; g++) {
        const dd = d + (g - group / 2) * 0.9 + (rand() - 0.5) * 0.4;
        const c = pointAt(path, dd);
        const h = poseAt(path, dd).heading;
        const off = side * (out0 + (rand() - 0.5) * 0.8);
        const x = c.x + Math.cos(h) * off;
        const z = c.z + Math.sin(h) * off;
        // Never on another stretch of road (hairpins, loops).
        if (roadNear(index, x, z).distM < ROAD_HALF_WIDTH_M + 0.8) continue;
        out.push({
          x,
          y: groundHeight(index, x, z),
          z,
          // Right of the road they look left of the travel direction, and vice versa.
          facing: h - side * (Math.PI / 2) + (rand() - 0.5) * 0.8,
          heightM: 1.6 + rand() * 0.3,
          shirt: Math.floor(rand() * SHIRT_COLOURS),
          phase: rand() * Math.PI * 2,
          d: dd,
        });
      }
    }
  }
  return out;
}

/** Turns tighter than this (radius under 90 m) get a guardrail on the outside. */
const RAIL_TURN = 1 / 90;
export const RAIL_OUT_M = 1.0;
export const RAIL_BOTTOM_M = 0.45;
export const RAIL_TOP_M = 0.8;

export interface Guardrails {
  /** Vertical metal band (draw both faces). */
  rail: MeshData;
  /** Posts every 4 m along it. */
  posts: RoadsidePost[];
}

/** Metal guardrails on the outside of tight corners, where a real road would have them. */
export function guardrails(path: WorldPath, stepM = 4): Guardrails {
  const spans: { from: number; to: number; side: number }[] = [];
  let open: { from: number; side: number } | null = null;
  for (let d = 0; d <= path.distanceM; d += stepM) {
    const t = turnAt(path, d);
    // Outside of a right turn is the left (-1).
    const side = Math.abs(t) > RAIL_TURN ? -Math.sign(t) : 0;
    if (open && side !== open.side) {
      spans.push({
        from: Math.max(0, open.from - 12),
        to: Math.min(path.distanceM, d + 12),
        side: open.side,
      });
      open = null;
    }
    if (!open && side !== 0) open = { from: d, side };
  }
  if (open) spans.push({ from: Math.max(0, open.from - 12), to: path.distanceM, side: open.side });

  const pos: number[] = [];
  const idx: number[] = [];
  const posts: RoadsidePost[] = [];
  const off = ROAD_HALF_WIDTH_M + RAIL_OUT_M;
  for (const s of spans) {
    const base = pos.length / 3;
    let n = 0;
    for (let d = s.from; d <= s.to + 0.001; d += stepM) {
      const c = pointAt(path, d);
      const h = poseAt(path, d).heading;
      const x = c.x + Math.cos(h) * off * s.side;
      const z = c.z + Math.sin(h) * off * s.side;
      pos.push(x, c.y + RAIL_BOTTOM_M, z, x, c.y + RAIL_TOP_M, z);
      posts.push({ x, y: c.y, z, heading: h });
      if (n > 0) {
        const a = base + (n - 1) * 2;
        idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
      }
      n++;
    }
  }
  return {
    rail: { positions: new Float32Array(pos), indices: new Uint32Array(idx) },
    posts,
  };
}
