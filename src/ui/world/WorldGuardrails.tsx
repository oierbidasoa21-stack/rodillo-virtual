import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { DoubleSide, type InstancedMesh, Object3D } from 'three';
import type { WorldPath } from '../../domain/world/path';
import { guardrails } from '../../domain/world/roadside';
import { toGeometry } from './geometry';

/** Galvanised guardrails with posts on the outside of tight corners. */
export default function WorldGuardrails({ path }: { path: WorldPath }) {
  const { rail, posts } = useMemo(() => guardrails(path), [path]);
  const geometry = useMemo(() => toGeometry(rail), [rail]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const postRef = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    const o = new Object3D();
    posts.forEach((p, i) => {
      // From below the verge (ground sits 0.6 m under the road) up to the rail.
      o.position.set(p.x, p.y + 0.08, p.z);
      o.rotation.set(0, -p.heading, 0);
      o.updateMatrix();
      postRef.current?.setMatrixAt(i, o.matrix);
    });
    if (postRef.current) {
      postRef.current.instanceMatrix.needsUpdate = true;
      postRef.current.computeBoundingSphere();
    }
  }, [posts]);

  if (posts.length === 0) return null;
  return (
    <>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial color="#b9bec4" metalness={0.65} roughness={0.38} side={DoubleSide} />
      </mesh>
      <instancedMesh
        ref={postRef}
        args={[undefined, undefined, posts.length]}
        count={posts.length}
        castShadow
      >
        <boxGeometry args={[0.1, 1.36, 0.1]} />
        <meshStandardMaterial color="#8f949a" metalness={0.5} roughness={0.5} />
      </instancedMesh>
    </>
  );
}
