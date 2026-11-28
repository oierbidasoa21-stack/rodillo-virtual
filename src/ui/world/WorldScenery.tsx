import { useLayoutEffect, useMemo, useRef } from 'react';
import { Color, type InstancedMesh, Matrix4 } from 'three';
import type { WorldPath } from '../../domain/world/path';
import { thin } from '../../domain/world/quality';
import { scatterBushes, scatterRocks } from '../../domain/world/scenery';
import { type RoadIndex, rng } from '../../domain/world/terrain';
import { propMatrix } from './geometry';

/** Bushes and rocks by the roadside, half sunk into the ground. */
export default function WorldScenery({
  path,
  index,
  density = 1,
}: {
  path: WorldPath;
  index: RoadIndex;
  density?: number;
}) {
  const bushes = useMemo(() => thin(scatterBushes(path, index), density), [path, index, density]);
  const rocks = useMemo(() => thin(scatterRocks(path, index), density), [path, index, density]);
  const bushRef = useRef<InstancedMesh>(null);
  const rockRef = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    const m = new Matrix4();
    const c = new Color();
    const rand = rng(13);
    bushes.forEach((b, i) => {
      const s = b.sizeM / 2;
      bushRef.current?.setMatrixAt(
        i,
        propMatrix(m, b.x, b.y + s * 0.35, b.z, b.turn, s * 1.2, s * 0.8, s),
      );
      bushRef.current?.setColorAt(
        i,
        c.setRGB(0.16 + rand() * 0.12, 0.32 + rand() * 0.12, 0.1 + rand() * 0.06),
      );
    });
    rocks.forEach((r, i) => {
      const s = r.sizeM / 2;
      rockRef.current?.setMatrixAt(
        i,
        propMatrix(m, r.x, r.y + s * 0.2, r.z, r.turn, s * 1.1, s * 0.65, s * 0.85),
      );
      const g = 0.45 + rand() * 0.2;
      rockRef.current?.setColorAt(i, c.setRGB(g, g * 0.97, g * 0.92));
    });
    for (const mesh of [bushRef.current, rockRef.current]) {
      if (!mesh) continue;
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.computeBoundingSphere();
    }
  }, [bushes, rocks]);

  return (
    <>
      <instancedMesh
        ref={bushRef}
        args={[undefined, undefined, Math.max(1, bushes.length)]}
        count={bushes.length}
        castShadow
        receiveShadow
      >
        <icosahedronGeometry args={[1, 1]} />
        <meshLambertMaterial flatShading />
      </instancedMesh>
      <instancedMesh
        ref={rockRef}
        args={[undefined, undefined, Math.max(1, rocks.length)]}
        count={rocks.length}
        castShadow
        receiveShadow
      >
        <dodecahedronGeometry args={[1, 0]} />
        <meshLambertMaterial flatShading />
      </instancedMesh>
    </>
  );
}
