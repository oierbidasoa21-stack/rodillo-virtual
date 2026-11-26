import { useLayoutEffect, useMemo, useRef } from 'react';
import { type InstancedMesh, Object3D } from 'three';
import type { WorldPath } from '../../domain/world/path';
import { roadsidePosts } from '../../domain/world/road';

/**
 * White delineator posts with a reflector, every 50 m on both sides. They reach
 * below the road level so they meet the ground on the verge.
 */
export default function WorldPosts({ path }: { path: WorldPath }) {
  const posts = useMemo(() => roadsidePosts(path), [path]);
  const postRef = useRef<InstancedMesh>(null);
  const capRef = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    const o = new Object3D();
    posts.forEach((p, i) => {
      o.position.set(p.x, p.y + 0.25, p.z);
      o.rotation.set(0, -p.heading, 0);
      o.updateMatrix();
      postRef.current?.setMatrixAt(i, o.matrix);
      o.position.set(p.x, p.y + 0.85, p.z);
      o.updateMatrix();
      capRef.current?.setMatrixAt(i, o.matrix);
    });
    for (const mesh of [postRef.current, capRef.current]) {
      if (!mesh) continue;
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
    }
  }, [posts]);

  const count = Math.max(1, posts.length);
  return (
    <>
      <instancedMesh
        ref={postRef}
        args={[undefined, undefined, count]}
        count={posts.length}
        castShadow
      >
        <boxGeometry args={[0.12, 1.7, 0.12]} />
        <meshLambertMaterial color="#f1f1ee" />
      </instancedMesh>
      <instancedMesh ref={capRef} args={[undefined, undefined, count]} count={posts.length}>
        <boxGeometry args={[0.13, 0.2, 0.13]} />
        <meshLambertMaterial color="#1e1e1e" />
      </instancedMesh>
    </>
  );
}
