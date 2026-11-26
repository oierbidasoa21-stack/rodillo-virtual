import { type WorldPath, pointAt, poseAt } from './path';

export const ROAD_HALF_WIDTH_M = 3;

/** Triangle mesh as flat arrays, ready for a GPU buffer. */
export interface MeshData {
  /** x, y, z per vertex. */
  positions: Float32Array;
  /** Three vertex indices per triangle. */
  indices: Uint32Array;
  /** Texture coordinates (u, v) per vertex, when the mesh has them. */
  uvs?: Float32Array;
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
 * A flat strip along the path from `fromM` to `toM` metres right of the centre
 * line (negative = left), `liftM` above it. Two vertices per path point: left
 * then right. Texture coordinates: u = metres across from the left edge, v =
 * metres along the road, so a texture keeps its real size.
 */
export function strip(path: WorldPath, fromM: number, toM: number, liftM = 0): MeshData {
  const pts = path.points;
  const positions = new Float32Array(pts.length * 6);
  const uvs = new Float32Array(pts.length * 4);
  pts.forEach((p, i) => {
    const r = rightAt(path, i);
    positions.set(
      [
        p.x + r.x * fromM,
        p.y + liftM,
        p.z + r.z * fromM,
        p.x + r.x * toM,
        p.y + liftM,
        p.z + r.z * toM,
      ],
      i * 6,
    );
    uvs.set([0, p.d, toM - fromM, p.d], i * 4);
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
  return { positions, indices, uvs };
}

/** A ribbon centred on the road, `halfWidthM` either side. */
export function ribbon(path: WorldPath, halfWidthM: number, liftM = 0): MeshData {
  return strip(path, -halfWidthM, halfWidthM, liftM);
}

/** Merges meshes into one (one draw call). */
export function mergeMeshes(meshes: MeshData[]): MeshData {
  const nPos = meshes.reduce((s, m) => s + m.positions.length, 0);
  const nIdx = meshes.reduce((s, m) => s + m.indices.length, 0);
  const positions = new Float32Array(nPos);
  const indices = new Uint32Array(nIdx);
  let p = 0;
  let k = 0;
  for (const m of meshes) {
    positions.set(m.positions, p);
    const base = p / 3;
    m.indices.forEach((v, j) => (indices[k + j] = v + base));
    p += m.positions.length;
    k += m.indices.length;
  }
  return { positions, indices };
}

/** Solid white lines along both edges of the asphalt, `inM` metres in from the edge. */
export function edgeLines(
  path: WorldPath,
  halfWidthM = ROAD_HALF_WIDTH_M,
  inM = 0.2,
  widthM = 0.12,
): MeshData {
  const outer = halfWidthM - inM;
  return mergeMeshes([
    strip(path, -outer, -outer + widthM, 0.03),
    strip(path, outer - widthM, outer, 0.03),
  ]);
}

/** A roadside post: where it stands and which way the road runs there. */
export interface RoadsidePost {
  x: number;
  y: number;
  z: number;
  heading: number;
}

/**
 * Delineator posts on both sides of the road every `everyM` metres (as on
 * mountain roads), `outM` beyond the asphalt edge. They help to feel the speed.
 */
export function roadsidePosts(
  path: WorldPath,
  everyM = 50,
  outM = 1.6,
  halfWidthM = ROAD_HALF_WIDTH_M,
): RoadsidePost[] {
  const posts: RoadsidePost[] = [];
  for (let d = everyM / 2; d < path.distanceM; d += everyM) {
    const p = pointAt(path, d);
    const h = poseAt(path, d).heading;
    for (const side of [-1, 1]) {
      const off = side * (halfWidthM + outM);
      posts.push({ x: p.x + Math.cos(h) * off, y: p.y, z: p.z + Math.sin(h) * off, heading: h });
    }
  }
  return posts;
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
