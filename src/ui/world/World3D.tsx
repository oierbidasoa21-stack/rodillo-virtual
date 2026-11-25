import { Canvas } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import type { Route } from '../../domain/route/route';
import { projectRoute } from '../../domain/world/path';
import { indexRoad } from '../../domain/world/terrain';
import WorldRider, { type RiderMotion } from './WorldRider';
import WorldRoad from './WorldRoad';
import WorldSky, { SKY_HORIZON } from './WorldSky';
import WorldTerrain from './WorldTerrain';
import WorldTrees from './WorldTrees';

interface Props {
  route: Route;
  distanceM: number;
  speedMs: number;
  cadenceRpm: number | null;
  running: boolean;
}

/**
 * The route as a 3D world: road from its altimetry, rolling ground, trees, sky,
 * and a cyclist with a chase camera. Loaded on demand (it carries Three.js).
 */
export default function World3D({ route, distanceM, speedMs, cadenceRpm, running }: Props) {
  const path = useMemo(() => projectRoute(route), [route]);
  const index = useMemo(() => indexRoad(path), [path]);
  const motion = useRef<RiderMotion>({
    distanceM,
    speedMs,
    cadenceRpm,
    running,
    atMs: 0,
  });
  useEffect(() => {
    motion.current = { distanceM, speedMs, cadenceRpm, running, atMs: performance.now() };
  }, [distanceM, speedMs, cadenceRpm, running]);

  return (
    <Canvas
      className="world-canvas"
      dpr={[1, 1.5]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      camera={{ fov: 60, near: 0.1, far: 3000 }}
      aria-label={`Vista 3D de ${route.name}`}
    >
      <color attach="background" args={[SKY_HORIZON]} />
      <fog attach="fog" args={[SKY_HORIZON, 180, 1500]} />
      <hemisphereLight args={['#dcecff', '#5d6b3a', 1.6]} />
      <directionalLight position={[300, 500, 200]} intensity={1.8} />
      <WorldSky />
      <WorldTerrain path={path} index={index} />
      <WorldRoad path={path} />
      <WorldTrees path={path} index={index} />
      <WorldRider path={path} motion={motion} />
    </Canvas>
  );
}
