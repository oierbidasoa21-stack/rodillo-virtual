import { useEffect, useMemo } from 'react';
import type { WorldPath } from '../../domain/world/path';
import { type RealGrid, type RealHeights, realTerrainGrid } from '../../domain/world/realTerrain';
import type { RoadIndex } from '../../domain/world/terrain';
import { toGeometry } from './geometry';
import { paintBySlope } from './landColor';

/** Real relief around the route, up to 4 km, coloured by slope; takes shadows. */
export default function WorldRealTerrain({
  path,
  index,
  rh,
  maxVertices,
  onGrid,
}: {
  path: WorldPath;
  index: RoadIndex;
  rh: RealHeights;
  maxVertices: number;
  /** The near grid's extent, for the horizon to hide under it. */
  onGrid?: (grid: RealGrid) => void;
}) {
  const grid = useMemo(
    () => realTerrainGrid(path, index, rh, { maxVertices }),
    [path, index, rh, maxVertices],
  );
  useEffect(() => onGrid?.(grid), [grid, onGrid]);
  const geometry = useMemo(() => {
    const g = toGeometry(grid);
    paintBySlope(g, 200);
    return g;
  }, [grid]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshLambertMaterial vertexColors />
    </mesh>
  );
}
