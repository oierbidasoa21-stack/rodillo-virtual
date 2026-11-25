import { useEffect, useMemo } from 'react';
import { Color } from 'three';
import type { WorldPath } from '../../domain/world/path';
import { type RoadIndex, roadNear, terrainGrid, valueNoise } from '../../domain/world/terrain';
import { grassColor, toGeometry } from './geometry';

/** Rolling ground around the route, flat-shaded and coloured by height. */
export default function WorldTerrain({ path, index }: { path: WorldPath; index: RoadIndex }) {
  const geometry = useMemo(() => {
    const grid = terrainGrid(path, index);
    const colors = new Float32Array(grid.positions.length);
    const c = new Color();
    for (let i = 0; i < grid.positions.length; i += 3) {
      const x = grid.positions[i] ?? 0;
      const y = grid.positions[i + 1] ?? 0;
      const z = grid.positions[i + 2] ?? 0;
      const { roadY } = roadNear(index, x, z);
      grassColor(y - roadY, valueNoise(x / 60, z / 60, 5), c);
      colors.set([c.r, c.g, c.b], i);
    }
    return toGeometry(grid, colors);
  }, [path, index]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh geometry={geometry}>
      <meshLambertMaterial vertexColors flatShading />
    </mesh>
  );
}
