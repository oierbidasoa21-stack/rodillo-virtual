import { Canvas } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import type { Route } from '../../domain/route/route';
import { projectRoute } from '../../domain/world/path';
import { indexRoad } from '../../domain/world/terrain';
import WorldHorizon from './WorldHorizon';
import WorldPosts from './WorldPosts';
import WorldRider, { type RiderMotion } from './WorldRider';
import WorldRoad from './WorldRoad';
import WorldScenery from './WorldScenery';
import WorldGuardrails from './WorldGuardrails';
import WorldSky from './WorldSky';
import WorldSpectators from './WorldSpectators';
import WorldSun from './WorldSun';
import WorldTerrain from './WorldTerrain';
import WorldTrees from './WorldTrees';
import { LIGHTING } from './sun';
import type { TimeOfDay } from './timeOfDay';

interface Props {
  route: Route;
  distanceM: number;
  speedMs: number;
  cadenceRpm: number | null;
  running: boolean;
  timeOfDay?: TimeOfDay;
}

/**
 * The route as a 3D world: road from its altimetry, rolling ground, trees,
 * roadside posts, sky with sun and clouds, shadows, and a cyclist with a chase camera. Loaded on demand (it carries Three.js).
 */
export default function World3D({
  route,
  distanceM,
  speedMs,
  cadenceRpm,
  running,
  timeOfDay = 'morning',
}: Props) {
  const light = LIGHTING[timeOfDay];
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
      shadows
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      camera={{ fov: 58, near: 0.5, far: 8000 }}
      aria-label={`Vista 3D de ${route.name}`}
    >
      <color attach="background" args={[light.horizon]} />
      <fog attach="fog" args={[light.horizon, 250, 6000]} />
      <hemisphereLight args={light.hemi} />
      <WorldSun light={light} />
      <WorldSky light={light} />
      <WorldTerrain path={path} index={index} />
      <WorldHorizon path={path} />
      <WorldRoad path={path} />
      <WorldPosts path={path} />
      <WorldGuardrails path={path} />
      <WorldSpectators path={path} index={index} motion={motion} />
      <WorldTrees path={path} index={index} />
      <WorldScenery path={path} index={index} />
      <WorldRider path={path} motion={motion} />
    </Canvas>
  );
}
