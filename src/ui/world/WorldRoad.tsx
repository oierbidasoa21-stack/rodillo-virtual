import { useEffect, useMemo } from 'react';
import { type WorldPath, poseAt } from '../../domain/world/path';
import { ROAD_HALF_WIDTH_M, centreDashes, edgeLines, ribbon } from '../../domain/world/road';
import { toGeometry } from './geometry';
import { asphaltTexture } from './textures';

/** Metres covered by one repeat of the asphalt texture. */
const ASPHALT_TILE_M = 3;

/** Textured asphalt, gravel verges, edge lines, a dashed centre line and an arch at the start. */
export default function WorldRoad({ path }: { path: WorldPath }) {
  const { road, verge, dashes, lines } = useMemo(
    () => ({
      road: toGeometry(ribbon(path, ROAD_HALF_WIDTH_M, 0.02)),
      verge: toGeometry(ribbon(path, ROAD_HALF_WIDTH_M + 1.2, -0.02)),
      dashes: toGeometry(centreDashes(path)),
      lines: toGeometry(edgeLines(path)),
    }),
    [path],
  );
  useEffect(
    () => () => {
      road.dispose();
      verge.dispose();
      dashes.dispose();
      lines.dispose();
    },
    [road, verge, dashes, lines],
  );
  const { asphalt, gravel } = useMemo(() => {
    const a = asphaltTexture();
    a.repeat.set(1 / ASPHALT_TILE_M, 1 / ASPHALT_TILE_M);
    const g = a.clone();
    g.repeat.set(1 / 1.5, 1 / 1.5);
    return { asphalt: a, gravel: g };
  }, []);
  useEffect(
    () => () => {
      asphalt.dispose();
      gravel.dispose();
    },
    [asphalt, gravel],
  );
  const start = useMemo(() => poseAt(path, 0), [path]);

  return (
    <>
      <mesh geometry={verge} receiveShadow>
        <meshLambertMaterial color="#d8ccb2" map={gravel} polygonOffset polygonOffsetFactor={-1} />
      </mesh>
      <mesh geometry={road} receiveShadow>
        <meshLambertMaterial map={asphalt} polygonOffset polygonOffsetFactor={-2} />
      </mesh>
      <mesh geometry={dashes} receiveShadow>
        <meshLambertMaterial color="#ecece6" polygonOffset polygonOffsetFactor={-3} />
      </mesh>
      <mesh geometry={lines} receiveShadow>
        <meshLambertMaterial color="#ecece6" polygonOffset polygonOffsetFactor={-3} />
      </mesh>
      {/* Start arch across the road */}
      <group
        position={[start.position.x, start.position.y, start.position.z]}
        rotation={[0, -start.heading, 0]}
      >
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * (ROAD_HALF_WIDTH_M + 0.8), 2.5, 0]} castShadow>
            <boxGeometry args={[0.35, 5, 0.35]} />
            <meshLambertMaterial color="#e8e8e8" />
          </mesh>
        ))}
        <mesh position={[0, 5, 0]} castShadow>
          <boxGeometry args={[ROAD_HALF_WIDTH_M * 2 + 2.2, 0.9, 0.3]} />
          <meshLambertMaterial color="#1f5fd1" />
        </mesh>
      </group>
    </>
  );
}
