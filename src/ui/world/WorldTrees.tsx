import { useLayoutEffect, useMemo, useRef } from 'react';
import { Color, type InstancedMesh, Matrix4 } from 'three';
import type { WorldPath } from '../../domain/world/path';
import { type RoadIndex, rng, scatterTrees } from '../../domain/world/terrain';
import { placeMatrix } from './geometry';

/** Conifers and round trees as instanced meshes: a few draw calls for thousands of trees. */
export default function WorldTrees({ path, index }: { path: WorldPath; index: RoadIndex }) {
  const trees = useMemo(() => scatterTrees(path, index), [path, index]);
  const conifers = useMemo(() => trees.filter((t) => t.kind === 0), [trees]);
  const leafy = useMemo(() => trees.filter((t) => t.kind === 1), [trees]);

  const coneRef = useRef<InstancedMesh>(null);
  const ballRef = useRef<InstancedMesh>(null);
  const trunkRef = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    const m = new Matrix4();
    const c = new Color();
    const rand = rng(7);
    conifers.forEach((t, i) => {
      // Crown: a cone over the top 80 % of the tree.
      coneRef.current?.setMatrixAt(
        i,
        placeMatrix(m, t.x, t.y + t.heightM * 0.55, t.z, t.heightM * 0.28, t.heightM * 0.8),
      );
      coneRef.current?.setColorAt(i, c.setRGB(0.12 + rand() * 0.06, 0.32 + rand() * 0.1, 0.18));
    });
    leafy.forEach((t, i) => {
      ballRef.current?.setMatrixAt(
        i,
        placeMatrix(m, t.x, t.y + t.heightM * 0.65, t.z, t.heightM * 0.35, t.heightM * 0.4),
      );
      ballRef.current?.setColorAt(i, c.setRGB(0.25 + rand() * 0.12, 0.45 + rand() * 0.12, 0.2));
    });
    trees.forEach((t, i) => {
      trunkRef.current?.setMatrixAt(
        i,
        placeMatrix(m, t.x, t.y + t.heightM * 0.2, t.z, 0.25, t.heightM * 0.4),
      );
    });
    for (const mesh of [coneRef.current, ballRef.current, trunkRef.current]) {
      if (!mesh) continue;
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.computeBoundingSphere();
    }
  }, [trees, conifers, leafy]);

  return (
    <>
      <instancedMesh
        ref={coneRef}
        args={[undefined, undefined, Math.max(1, conifers.length)]}
        count={conifers.length}
      >
        <coneGeometry args={[1, 1, 7]} />
        <meshLambertMaterial flatShading />
      </instancedMesh>
      <instancedMesh
        ref={ballRef}
        args={[undefined, undefined, Math.max(1, leafy.length)]}
        count={leafy.length}
      >
        <icosahedronGeometry args={[1, 0]} />
        <meshLambertMaterial flatShading />
      </instancedMesh>
      <instancedMesh
        ref={trunkRef}
        args={[undefined, undefined, Math.max(1, trees.length)]}
        count={trees.length}
      >
        <cylinderGeometry args={[1, 1, 1, 5]} />
        <meshLambertMaterial color="#6b4a2f" />
      </instancedMesh>
    </>
  );
}
