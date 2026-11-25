import { BufferAttribute, BufferGeometry, Color, Matrix4, Mesh, Quaternion, Vector3 } from 'three';
import type { MeshData } from '../../domain/world/road';

/** A Three.js geometry from flat domain arrays, with normals for lighting. */
export function toGeometry(mesh: MeshData, colors?: Float32Array): BufferGeometry {
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(mesh.positions, 3));
  g.setIndex(new BufferAttribute(mesh.indices, 1));
  if (colors) g.setAttribute('color', new BufferAttribute(colors, 3));
  g.computeVertexNormals();
  g.computeBoundingSphere();
  return g;
}

const UP = new Vector3(0, 1, 0);
const dir = new Vector3();
const q = new Quaternion();

/** Places a unit-height cylinder mesh so it spans from `a` to `b`. */
export function spanRod(mesh: Mesh, a: Vector3, b: Vector3): void {
  dir.subVectors(b, a);
  const len = dir.length() || 0.0001;
  mesh.position.addVectors(a, b).multiplyScalar(0.5);
  q.setFromUnitVectors(UP, dir.divideScalar(len));
  mesh.quaternion.copy(q);
  mesh.scale.set(1, len, 1);
}

/** Matrix for an instanced object at (x, y, z) with a uniform-ish scale. */
export function placeMatrix(
  m: Matrix4,
  x: number,
  y: number,
  z: number,
  sx: number,
  sy: number,
): Matrix4 {
  return m.makeScale(sx, sy, sx).setPosition(x, y, z);
}

/** Grass colour for the ground: lusher low down, drier and lighter higher up. */
export function grassColor(heightAboveRoadM: number, noise01: number, out: Color): Color {
  const dry = Math.min(1, Math.max(0, heightAboveRoadM / 40));
  out.setRGB(
    0.36 + 0.18 * dry + 0.06 * noise01,
    0.55 + 0.08 * dry + 0.08 * noise01,
    0.27 + 0.05 * dry,
  );
  return out;
}
