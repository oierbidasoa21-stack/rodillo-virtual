import { useEffect, useMemo } from 'react';
import { Color } from 'three';
import type { WorldPath } from '../../domain/world/path';
import { horizonRing } from '../../domain/world/scenery';
import { TERRAIN_MARGIN_M, valueNoise } from '../../domain/world/terrain';
import { toGeometry } from './geometry';

const GRASS = new Color(0.36, 0.55, 0.27);
const FOREST = new Color(0.16, 0.3, 0.16);
const ROCK = new Color(0.5, 0.47, 0.43);
const SNOW = new Color(0.93, 0.95, 0.98);

/** Colour of distant land by height above the far level: meadows, forest, rock, snow. */
function landColor(aboveM: number, n: number, out: Color): Color {
  const a = aboveM + (n - 0.5) * 120;
  if (a < 60) return out.copy(GRASS).lerp(FOREST, Math.max(0, a / 60));
  if (a < 320) return out.copy(FOREST).lerp(ROCK, Math.max(0, (a - 220) / 100));
  if (a < 520) return out.copy(ROCK);
  return out.copy(ROCK).lerp(SNOW, Math.min(1, (a - 520) / 60));
}

/** Land from the edge of the terrain to the horizon, with mountains fading into the haze. */
export default function WorldHorizon({ path }: { path: WorldPath }) {
  const geometry = useMemo(() => {
    const ring = horizonRing(path, TERRAIN_MARGIN_M);
    const colors = new Float32Array(ring.positions.length);
    const c = new Color();
    ring.heightAboveM.forEach((above, v) => {
      const x = ring.positions[v * 3] ?? 0;
      const z = ring.positions[v * 3 + 2] ?? 0;
      landColor(above, valueNoise(x / 400, z / 400, 17), c);
      colors.set([c.r, c.g, c.b], v * 3);
    });
    return toGeometry(ring, colors);
  }, [path]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <mesh geometry={geometry}>
      <meshLambertMaterial vertexColors flatShading />
    </mesh>
  );
}
