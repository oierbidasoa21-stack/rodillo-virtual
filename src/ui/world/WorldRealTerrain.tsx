import { useEffect, useMemo } from 'react';
import { BufferAttribute } from 'three';
import { mosaicUvs } from '../../domain/geo/imagery';
import { LANDSCAPE } from '../../domain/geo/landscape';
import type { Route } from '../../domain/route/route';
import type { WorldPath } from '../../domain/world/path';
import { type RealGrid, type RealHeights, realTerrainGrid } from '../../domain/world/realTerrain';
import type { RoadIndex } from '../../domain/world/terrain';
import { toGeometry } from './geometry';
import { paintBySlope } from './landColor';
import { useMosaicTexture } from './useMosaicTexture';

/**
 * Real relief around the route, up to 4 km, under the satellite photo when it
 * was downloaded (plain colour by slope if not); takes shadows.
 */
export default function WorldRealTerrain({
  route,
  path,
  index,
  rh,
  maxVertices,
  imageryMaxPx,
  onGrid,
}: {
  route: Route;
  path: WorldPath;
  index: RoadIndex;
  rh: RealHeights;
  maxVertices: number;
  imageryMaxPx: number;
  /** The near grid's extent, for the horizon to hide under it. */
  onGrid?: (grid: RealGrid) => void;
}) {
  const grid = useMemo(
    () => realTerrainGrid(path, index, rh, { maxVertices }),
    [path, index, rh, maxVertices],
  );
  useEffect(() => onGrid?.(grid), [grid, onGrid]);
  const photo = useMosaicTexture(route, LANDSCAPE.imageryNearZ, imageryMaxPx);
  const layout = photo?.layout ?? null;
  const geometry = useMemo(() => {
    const g = toGeometry(grid);
    if (layout)
      g.setAttribute('uv', new BufferAttribute(mosaicUvs(grid.positions, rh.frame, layout), 2));
    else paintBySlope(g, 200);
    return g;
  }, [grid, rh, layout]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh geometry={geometry} receiveShadow>
      {photo ? (
        <meshLambertMaterial key="photo" map={photo.texture} />
      ) : (
        <meshLambertMaterial key="plain" vertexColors />
      )}
    </mesh>
  );
}
