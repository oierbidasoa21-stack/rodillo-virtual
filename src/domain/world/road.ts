import { type WorldPath, pointAt, poseAt } from './path';

export const ROAD_HALF_WIDTH_M = 3;

/** Triangle mesh as flat arrays, ready for a GPU buffer. */
export interface MeshData {
  /** x, y, z per vertex. */
  positions: Float32Array;
  /** Three vertex indices per triangle. */
  indices: Uint32Array;
}

/** Unit vector pointing to the right of the direction of travel at point `i`, in the xz plane. */
function rightAt(path: WorldPath, i: number): { x: number; z: number } {
  const pts = path.points;
  const n = pts.length;
  // Direction over ±2 points (±20 m) so corners are not jagged.
  const get = (j: number) => {
    if (path.closed) return pts[((j % (n - 1)) + (n - 1)) % (n - 1)];
    return pts[Math.min(n - 1, Math.max(0, j))];
  };
  const a = get(i - 2);
  const b = get(i + 2);
  if (!a || !b) return { x: 1, z: 0 };
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const len = Math.hypot(dx, dz) || 1;
  // Right of the travel direction (dx, dz) with z pointing south: (-dz, dx). North (0, -1) → east (1, 0).
  return { x: -dz / len, z: dx / len };
}

/**
 * A flat ribbon along the path, `halfWidthM` either side of the centre line,
 * `liftM` above it. Two vertices per path point: left then right.
 */
export function ribbon(path: WorldPath, halfWidthM: number, liftM = 0): MeshData {
  const pts = path.points;
  const positions = new Float32Array(pts.length * 6);
  pts.forEach((p, i) => {
    const r = rightAt(path, i);
    positions.set(
      [
        p.x - r.x * halfWidthM,
        p.y + liftM,
        p.z - r.z * halfWidthM,
        p.x + r.x * halfWidthM,
        p.y + liftM,
        p.z + r.z * halfWidthM,
      ],
      i * 6,
    );
  });
  const quads = Math.max(0, pts.length - 1);
  const indices = new Uint32Array(quads * 6);
  for (let i = 0; i < quads; i++) {
    const l0 = i * 2;
    const r0 = l0 + 1;
    const l1 = l0 + 2;
    const r1 = l0 + 3;
    // Counter-clockwise seen from above, so the face points up.
    indices.set([l0, r0, l1, r0, r1, l1], i * 6);
  }
  return { positions, indices };
}

/** Dashed centre line: a `lengthM` dash every `everyM` metres, placed by distance along the road. */
export function centreDashes(
  path: WorldPath,
  everyM = 12,
  lengthM = 4,
  halfWidthM = 0.08,
): MeshData {
  const starts: number[] = [];
  for (let d = 0; d + lengthM <= path.distanceM; d += everyM) starts.push(d);
  const positions = new Float32Array(starts.length * 12);
  const indices = new Uint32Array(starts.length * 6);
  const y = 0.03;
  starts.forEach((d, q) => {
    const ends = [d, d + lengthM].map((dd) => {
      const p = pointAt(path, dd);
      // Right of the heading (0 = north): (cos h, sin h) in x/z.
      const h = poseAt(path, dd).heading;
      return { p, rx: Math.cos(h) * halfWidthM, rz: Math.sin(h) * halfWidthM };
    });
    const flat = ends.flatMap(({ p, rx, rz }) => [
      p.x - rx,
      p.y + y,
      p.z - rz,
      p.x + rx,
      p.y + y,
      p.z + rz,
    ]);
    positions.set(flat, q * 12);
    const v = q * 4;
    indices.set([v, v + 1, v + 2, v + 1, v + 3, v + 2], q * 6);
  });
  return { positions, indices };
}
