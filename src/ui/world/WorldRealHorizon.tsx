import { useEffect, useMemo } from 'react';
import type { WorldPath } from '../../domain/world/path';
import { type RealGrid, type RealHeights, realHorizonGrid } from '../../domain/world/realTerrain';
import { toGeometry } from './geometry';
import { paintBySlope } from './landColor';

/** Real land from the near terrain to the horizon (25 km), from the coarse tiles. */
export default function WorldRealHorizon({
  path,
  rh,
  near,
}: {
  path: WorldPath;
  rh: RealHeights;
  near: RealGrid;
}) {
  const geometry = useMemo(() => {
    const g = toGeometry(realHorizonGrid(path, rh, near.bounds));
    paintBySlope(g, 900);
    return g;
  }, [path, rh, near]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh geometry={geometry}>
      <meshLambertMaterial vertexColors />
    </mesh>
  );
}
