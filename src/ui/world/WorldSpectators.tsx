import { useFrame } from '@react-three/fiber';
import { type RefObject, useLayoutEffect, useMemo, useRef } from 'react';
import { Color, type InstancedMesh, Matrix4, Quaternion, Vector3 } from 'three';
import type { WorldPath } from '../../domain/world/path';
import { placeSpectators } from '../../domain/world/roadside';
import { type RoadIndex, rng } from '../../domain/world/terrain';
import type { RiderMotion } from './WorldRider';

const SHIRTS = [
  '#d7263d',
  '#f7c815',
  '#f08a24',
  '#1b998b',
  '#f4f4f4',
  '#2e5eaa',
  '#e84a9a',
  '#222',
].map((c) => new Color(c));
const SKINS = ['#f1c9a5', '#e0ac85', '#c68863', '#8d5a3b'].map((c) => new Color(c));
const PANTS = ['#1f2a3a', '#3b3b3b', '#5a4a3a', '#2c3e50'].map((c) => new Color(c));

const UP = new Vector3(0, 1, 0);
const Z = new Vector3(0, 0, 1);
/** Body parts of a 1.75 m person facing -z, feet at y = 0 (geometries are unit-sized). */
const local = (x: number, y: number, z: number, sx: number, sy: number, sz: number) =>
  new Matrix4().compose(new Vector3(x, y, z), new Quaternion(), new Vector3(sx, sy, sz));
const LEGS = local(0, 0.43, 0, 0.3, 0.86, 0.2);
const BODY = local(0, 1.15, 0, 0.38, 0.6, 0.24);
const HEAD = local(0, 1.6, 0, 0.12, 0.13, 0.12);
const SHOULDER_Y = 1.4;
const SHOULDER_X = 0.23;
const ARM_M = 0.62;
/** Only people this close (along the road) to the rider are animated. */
const ANIMATE_M = 250;
/** Within this distance they jump and wave flat out. */
const EXCITED_M = 45;

/**
 * Spectators that cheer: arms up and waving, clapping, jumping when the rider
 * goes past. Instanced (a handful of draw calls for the whole crowd).
 */
export default function WorldSpectators({
  path,
  index,
  motion,
}: {
  path: WorldPath;
  index: RoadIndex;
  motion: RefObject<RiderMotion>;
}) {
  const crowd = useMemo(() => placeSpectators(path, index), [path, index]);
  const legs = useRef<InstancedMesh>(null);
  const body = useRef<InstancedMesh>(null);
  const head = useRef<InstancedMesh>(null);
  const armL = useRef<InstancedMesh>(null);
  const armR = useRef<InstancedMesh>(null);
  const tmp = useMemo(
    () => ({
      person: new Matrix4(),
      part: new Matrix4(),
      armLocal: new Matrix4(),
      q: new Quaternion(),
      qz: new Quaternion(),
      v: new Vector3(),
      s: new Vector3(),
    }),
    [],
  );

  /** Places person `i` with a jump of `jumpM` and arms raised `armL`/`armR` radians from down. */
  const pose = (i: number, jumpM: number, aL: number, aR: number) => {
    const p = crowd[i];
    if (!p) return;
    const k = p.heightM / 1.75;
    tmp.person.compose(
      tmp.v.set(p.x, p.y + jumpM, p.z),
      tmp.q.setFromAxisAngle(UP, -p.facing),
      tmp.s.set(k, k, k),
    );
    legs.current?.setMatrixAt(i, tmp.part.multiplyMatrices(tmp.person, LEGS));
    body.current?.setMatrixAt(i, tmp.part.multiplyMatrices(tmp.person, BODY));
    head.current?.setMatrixAt(i, tmp.part.multiplyMatrices(tmp.person, HEAD));
    for (const [mesh, side, a] of [
      [armL.current, -1, aL],
      [armR.current, 1, aR],
    ] as const) {
      // Arm hangs from the shoulder, swung out sideways by `a` (0 = down, π = straight up).
      const dx = side * Math.sin(a);
      const dy = -Math.cos(a);
      tmp.armLocal.compose(
        tmp.v.set(side * SHOULDER_X + (dx * ARM_M) / 2, SHOULDER_Y + (dy * ARM_M) / 2, -0.02),
        tmp.qz.setFromAxisAngle(Z, Math.PI + side * a),
        tmp.s.set(0.07, ARM_M, 0.07),
      );
      mesh?.setMatrixAt(i, tmp.part.multiplyMatrices(tmp.person, tmp.armLocal));
    }
  };

  useLayoutEffect(() => {
    const rand = rng(3);
    crowd.forEach((p, i) => {
      pose(i, 0, 0.4, 0.4);
      const shirt = SHIRTS[p.shirt] ?? SHIRTS[0];
      if (!shirt) return;
      body.current?.setColorAt(i, shirt);
      armL.current?.setColorAt(i, shirt);
      armR.current?.setColorAt(i, shirt);
      const skin = SKINS[Math.floor(rand() * SKINS.length)];
      const pants = PANTS[Math.floor(rand() * PANTS.length)];
      if (skin) head.current?.setColorAt(i, skin);
      if (pants) legs.current?.setColorAt(i, pants);
    });
    for (const mesh of [legs, body, head, armL, armR].map((r) => r.current)) {
      if (!mesh) continue;
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.computeBoundingSphere();
    }
    // `pose` only reads refs and the crowd, which is the dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [crowd]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const riderD = motion.current.distanceM;
    let moved = false;
    crowd.forEach((p, i) => {
      let gap = Math.abs(p.d - riderD);
      if (path.closed) gap = Math.min(gap, path.distanceM - gap);
      if (gap > ANIMATE_M) return;
      moved = true;
      // Calm cheering further away, all-out when the rider is close.
      const e = gap < EXCITED_M ? 1 : 0.35;
      const w = t * (5 + e * 4) + p.phase;
      const jump = e === 1 ? Math.max(0, Math.sin(w)) * 0.22 : 0;
      if (p.shirt % 3 === 0) {
        // Clapping above the head.
        const a = 2.5 + Math.sin(w * 1.6) * 0.25;
        pose(i, jump, a, a);
      } else {
        // Waving both arms, out of step with each other.
        pose(i, jump, 2.2 + Math.sin(w) * 0.6 * e, 2.0 + Math.sin(w + 1.7) * 0.6 * e + (1 - e));
      }
    });
    if (!moved) return;
    for (const mesh of [legs, body, head, armL, armR].map((r) => r.current)) {
      if (mesh) mesh.instanceMatrix.needsUpdate = true;
    }
  });

  const n = Math.max(1, crowd.length);
  const args = [undefined, undefined, n] as const;
  return (
    <>
      <instancedMesh ref={legs} args={args} count={crowd.length} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshLambertMaterial />
      </instancedMesh>
      <instancedMesh ref={body} args={args} count={crowd.length} castShadow>
        <cylinderGeometry args={[0.5, 0.42, 1, 8]} />
        <meshLambertMaterial />
      </instancedMesh>
      <instancedMesh ref={head} args={args} count={crowd.length} castShadow>
        <sphereGeometry args={[1, 10, 8]} />
        <meshLambertMaterial />
      </instancedMesh>
      <instancedMesh ref={armL} args={args} count={crowd.length} castShadow>
        <cylinderGeometry args={[0.5, 0.45, 1, 6]} />
        <meshLambertMaterial />
      </instancedMesh>
      <instancedMesh ref={armR} args={args} count={crowd.length} castShadow>
        <cylinderGeometry args={[0.5, 0.45, 1, 6]} />
        <meshLambertMaterial />
      </instancedMesh>
    </>
  );
}
