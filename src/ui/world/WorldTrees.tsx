import { useLayoutEffect, useMemo, useRef } from 'react';
import { Color, type InstancedMesh, Matrix4 } from 'three';
import type { WorldPath } from '../../domain/world/path';
import { scatterTrees } from '../../domain/world/scenery';
import { type RoadIndex, rng } from '../../domain/world/terrain';
import { propMatrix } from './geometry';

/**
 * Trees as instanced meshes (a few draw calls for thousands of trees): conifers
 * with two tiers, leafy trees with an uneven crown, and tall poplars with pale
 * trunks. Each one turned and tinted a little differently.
 */
export default function WorldTrees({ path, index }: { path: WorldPath; index: RoadIndex }) {
  const trees = useMemo(() => scatterTrees(path, index), [path, index]);
  const groups = useMemo(
    () => ({
      conifer: trees.filter((t) => t.kind === 0),
      leafy: trees.filter((t) => t.kind === 1),
      poplar: trees.filter((t) => t.kind === 2),
    }),
    [trees],
  );

  const cone = useRef<InstancedMesh>(null);
  const cone2 = useRef<InstancedMesh>(null);
  const crown = useRef<InstancedMesh>(null);
  const crown2 = useRef<InstancedMesh>(null);
  const poplar = useRef<InstancedMesh>(null);
  const trunk = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    const m = new Matrix4();
    const c = new Color();
    const rand = rng(7);
    groups.conifer.forEach((t, i) => {
      const h = t.sizeM;
      cone.current?.setMatrixAt(
        i,
        propMatrix(m, t.x, t.y + h * 0.45, t.z, t.turn, h * 0.3, h * 0.6),
      );
      cone2.current?.setMatrixAt(
        i,
        propMatrix(m, t.x, t.y + h * 0.74, t.z, t.turn, h * 0.21, h * 0.52),
      );
      c.setRGB(0.09 + rand() * 0.05, 0.24 + rand() * 0.1, 0.13 + rand() * 0.05);
      cone.current?.setColorAt(i, c);
      cone2.current?.setColorAt(i, c.offsetHSL(0, 0, 0.03));
    });
    groups.leafy.forEach((t, i) => {
      const h = t.sizeM;
      const ox = Math.cos(t.turn) * h * 0.16;
      const oz = Math.sin(t.turn) * h * 0.16;
      crown.current?.setMatrixAt(
        i,
        propMatrix(m, t.x, t.y + h * 0.62, t.z, t.turn, h * 0.34, h * 0.36, h * 0.3),
      );
      crown2.current?.setMatrixAt(
        i,
        propMatrix(m, t.x + ox, t.y + h * 0.78, t.z + oz, -t.turn, h * 0.22, h * 0.22),
      );
      c.setRGB(0.22 + rand() * 0.14, 0.4 + rand() * 0.14, 0.15 + rand() * 0.06);
      crown.current?.setColorAt(i, c);
      crown2.current?.setColorAt(i, c.offsetHSL(0.01, 0, 0.04));
    });
    groups.poplar.forEach((t, i) => {
      const h = t.sizeM;
      poplar.current?.setMatrixAt(
        i,
        propMatrix(m, t.x, t.y + h * 0.58, t.z, t.turn, h * 0.13, h * 0.42),
      );
      poplar.current?.setColorAt(
        i,
        c.setRGB(0.34 + rand() * 0.1, 0.5 + rand() * 0.1, 0.18 + rand() * 0.05),
      );
    });
    trees.forEach((t, i) => {
      const h = t.sizeM;
      const thick = t.kind === 2 ? 0.16 : 0.2 + h * 0.012;
      trunk.current?.setMatrixAt(
        i,
        propMatrix(m, t.x, t.y + h * 0.2, t.z, t.turn, thick, h * 0.42),
      );
      trunk.current?.setColorAt(i, t.kind === 2 ? c.set('#d9d4c8') : c.set('#5e4330'));
    });
    for (const mesh of [cone, cone2, crown, crown2, poplar, trunk].map((r) => r.current)) {
      if (!mesh) continue;
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.computeBoundingSphere();
    }
  }, [trees, groups]);

  const n = {
    conifer: groups.conifer.length,
    leafy: groups.leafy.length,
    poplar: groups.poplar.length,
  };
  const args = (count: number) => [undefined, undefined, Math.max(1, count)] as const;
  return (
    <>
      <instancedMesh ref={cone} args={args(n.conifer)} count={n.conifer} castShadow>
        <coneGeometry args={[1, 1, 9]} />
        <meshLambertMaterial flatShading />
      </instancedMesh>
      <instancedMesh ref={cone2} args={args(n.conifer)} count={n.conifer} castShadow>
        <coneGeometry args={[1, 1, 9]} />
        <meshLambertMaterial flatShading />
      </instancedMesh>
      <instancedMesh ref={crown} args={args(n.leafy)} count={n.leafy} castShadow>
        <icosahedronGeometry args={[1, 1]} />
        <meshLambertMaterial flatShading />
      </instancedMesh>
      <instancedMesh ref={crown2} args={args(n.leafy)} count={n.leafy} castShadow>
        <icosahedronGeometry args={[1, 1]} />
        <meshLambertMaterial flatShading />
      </instancedMesh>
      <instancedMesh ref={poplar} args={args(n.poplar)} count={n.poplar} castShadow>
        <icosahedronGeometry args={[1, 1]} />
        <meshLambertMaterial flatShading />
      </instancedMesh>
      <instancedMesh ref={trunk} args={args(trees.length)} count={trees.length} castShadow>
        <cylinderGeometry args={[0.7, 1, 1, 6]} />
        <meshLambertMaterial />
      </instancedMesh>
    </>
  );
}
