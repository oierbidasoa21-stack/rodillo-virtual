import { useEffect, useMemo } from 'react';
import { BufferAttribute } from 'three';
import { mosaicUvs } from '../../domain/geo/imagery';
import { LANDSCAPE } from '../../domain/geo/landscape';
import type { Route } from '../../domain/route/route';
import type { WorldPath } from '../../domain/world/path';
import { type RealGrid, type RealHeights, realHorizonGrid } from '../../domain/world/realTerrain';
import { toGeometry } from './geometry';
import { paintBySlope } from './landColor';
import { useMosaicTexture } from './useMosaicTexture';

/** The coarse horizon photo is small: 2048 px is plenty for ~50 km of land. */
const HORIZON_PHOTO_PX = 2048;

/** Real land from the near terrain to the horizon (25 km), under the coarse satellite photo. */
export default function WorldRealHorizon({
  route,
  path,
  rh,
  near,
}: {
  route: Route;
  path: WorldPath;
  rh: RealHeights;
  near: RealGrid;
}) {
  const grid = useMemo(() => realHorizonGrid(path, rh, near.bounds), [path, rh, near]);
  const photo = useMosaicTexture(route, LANDSCAPE.imageryFarZ, HORIZON_PHOTO_PX);
  const layout = photo?.layout ?? null;
  const geometry = useMemo(() => {
    const g = toGeometry(grid);
    if (layout)
      g.setAttribute('uv', new BufferAttribute(mosaicUvs(grid.positions, rh.frame, layout), 2));
    else paintBySlope(g, 900);
    return g;
  }, [grid, rh, layout]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh geometry={geometry}>
      {photo ? (
        <meshLambertMaterial key="photo" map={photo.texture} />
      ) : (
        <meshLambertMaterial key="plain" vertexColors />
      )}
    </mesh>
  );
}
