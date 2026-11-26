import { useEffect, useMemo } from 'react';
import { Color } from 'three';
import type { WorldPath } from '../../domain/world/path';
import { type RoadIndex, roadNear, terrainGrid, valueNoise } from '../../domain/world/terrain';
import { grassColor, toGeometry } from './geometry';
import { grassTexture } from './textures';

/** Metres covered by one repeat of the grass texture. */
const GRASS_TILE_M = 9;

/** Rolling ground around the route: coloured by height, with a grass texture, takes shadows. */
export default function WorldTerrain({ path, index }: { path: WorldPath; index: RoadIndex }) {
  const geometry = useMemo(() => {
    const grid = terrainGrid(path, index);
    const colors = new Float32Array(grid.positions.length);
    const uvs = new Float32Array((grid.positions.length / 3) * 2);
    const c = new Color();
    for (let i = 0; i < grid.positions.length; i += 3) {
      const x = grid.positions[i] ?? 0;
      const y = grid.positions[i + 1] ?? 0;
      const z = grid.positions[i + 2] ?? 0;
      const { roadY } = roadNear(index, x, z);
      grassColor(y - roadY, valueNoise(x / 60, z / 60, 5), c);
      colors.set([c.r, c.g, c.b], i);
      uvs.set([x / GRASS_TILE_M, z / GRASS_TILE_M], (i / 3) * 2);
    }
    return toGeometry({ ...grid, uvs }, colors);
  }, [path, index]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const map = useMemo(() => grassTexture(), []);
  useEffect(() => () => map.dispose(), [map]);

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshLambertMaterial vertexColors map={map} />
    </mesh>
  );
}
