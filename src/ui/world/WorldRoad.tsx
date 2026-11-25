import { useEffect, useMemo } from 'react';
import { type WorldPath, poseAt } from '../../domain/world/path';
import { ROAD_HALF_WIDTH_M, centreDashes, ribbon } from '../../domain/world/road';
import { toGeometry } from './geometry';

/** Asphalt, gravel verges, a dashed centre line and an arch at the start. */
export default function WorldRoad({ path }: { path: WorldPath }) {
  const { road, verge, dashes } = useMemo(
    () => ({
      road: toGeometry(ribbon(path, ROAD_HALF_WIDTH_M, 0.02)),
      verge: toGeometry(ribbon(path, ROAD_HALF_WIDTH_M + 1.2, -0.02)),
      dashes: toGeometry(centreDashes(path)),
    }),
    [path],
  );
  useEffect(
    () => () => {
      road.dispose();
      verge.dispose();
      dashes.dispose();
    },
    [road, verge, dashes],
  );
  const start = useMemo(() => poseAt(path, 0), [path]);

  return (
    <>
      <mesh geometry={verge}>
        <meshLambertMaterial color="#a39a86" polygonOffset polygonOffsetFactor={-1} />
      </mesh>
      <mesh geometry={road}>
        <meshLambertMaterial color="#4a4f57" polygonOffset polygonOffsetFactor={-2} />
      </mesh>
      <mesh geometry={dashes}>
        <meshBasicMaterial color="#f2f2ee" polygonOffset polygonOffsetFactor={-3} />
      </mesh>
      {/* Start arch across the road */}
      <group
        position={[start.position.x, start.position.y, start.position.z]}
        rotation={[0, -start.heading, 0]}
      >
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * (ROAD_HALF_WIDTH_M + 0.8), 2.5, 0]}>
            <boxGeometry args={[0.35, 5, 0.35]} />
            <meshLambertMaterial color="#e8e8e8" />
          </mesh>
        ))}
        <mesh position={[0, 5, 0]}>
          <boxGeometry args={[ROAD_HALF_WIDTH_M * 2 + 2.2, 0.9, 0.3]} />
          <meshLambertMaterial color="#1f5fd1" />
        </mesh>
      </group>
    </>
  );
}
