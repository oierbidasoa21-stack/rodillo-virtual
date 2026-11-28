import { Canvas } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import type { Route } from '../../domain/route/route';
import { projectRoute } from '../../domain/world/path';
import { type GraphicsQuality, QUALITY_PRESETS } from '../../domain/world/quality';
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
  /** Ajustes → Calidad del 3D. */
  quality?: GraphicsQuality;
  /** Your best earlier ride on this route, replayed. */
  ghost?: { distanceM: number; speedMs: number } | null;
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
  quality = 'high',
  ghost = null,
}: Props) {
  const light = LIGHTING[timeOfDay];
  const preset = QUALITY_PRESETS[quality];
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
  const ghostMotion = useRef<RiderMotion>({
    distanceM: 0,
    speedMs: 0,
    cadenceRpm: null,
    running: false,
    atMs: 0,
  });
  const ghostD = ghost?.distanceM ?? null;
  const ghostV = ghost?.speedMs ?? 0;
  useEffect(() => {
    if (ghostD === null) return;
    ghostMotion.current = {
      distanceM: ghostD,
      speedMs: ghostV,
      cadenceRpm: null,
      running,
      atMs: performance.now(),
    };
  }, [ghostD, ghostV, running]);

  return (
    <Canvas
      // Shadows, antialiasing and the camera are set when the canvas is created:
      // a new level means a new canvas.
      key={quality}
      className="world-canvas"
      dpr={[1, preset.maxDpr]}
      shadows={preset.shadows}
      gl={{ antialias: preset.antialias, powerPreference: 'high-performance' }}
      camera={{ fov: 58, near: 0.5, far: preset.farM }}
      aria-label={`Vista 3D de ${route.name}`}
    >
      <color attach="background" args={[light.horizon]} />
      <fog attach="fog" args={[light.horizon, 250, preset.fogEndM]} />
      <hemisphereLight args={light.hemi} />
      <WorldSun light={light} shadowMapPx={preset.shadowMapPx} />
      <WorldSky light={light} />
      <WorldTerrain path={path} index={index} />
      <WorldHorizon path={path} />
      <WorldRoad path={path} />
      <WorldPosts path={path} />
      <WorldGuardrails path={path} />
      <WorldSpectators path={path} index={index} motion={motion} density={preset.crowdDensity} />
      <WorldTrees path={path} index={index} density={preset.propDensity} />
      <WorldScenery path={path} index={index} density={preset.propDensity} />
      <WorldRider path={path} motion={motion} />
      {ghost && <WorldRider path={path} motion={ghostMotion} ghost />}
    </Canvas>
  );
}
