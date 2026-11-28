import { Canvas } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Route } from '../../domain/route/route';
import { projectRoute } from '../../domain/world/path';
import { type GraphicsQuality, QUALITY_PRESETS } from '../../domain/world/quality';
import type { RealGrid } from '../../domain/world/realTerrain';
import { indexRoad } from '../../domain/world/terrain';
import WorldHorizon from './WorldHorizon';
import WorldPosts from './WorldPosts';
import WorldRealHorizon from './WorldRealHorizon';
import WorldRealTerrain from './WorldRealTerrain';
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
import { useRealHeights } from './useRealHeights';

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
  ghost?: { distanceM: number; speedMs: number; label?: string } | null;
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
  // Real relief, when this GPX route's landscape was downloaded (phase 10).
  const real = useRealHeights(route);
  const [nearGrid, setNearGrid] = useState<RealGrid | null>(null);
  const farM = real ? preset.realFarM : preset.farM;
  const fogEndM = real ? preset.realFogEndM : preset.fogEndM;
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
      key={`${quality}-${real ? 'real' : 'usual'}`}
      className="world-canvas"
      dpr={[1, preset.maxDpr]}
      shadows={preset.shadows}
      gl={{
        antialias: preset.antialias,
        powerPreference: 'high-performance',
        // Tens of km of real horizon and a road a metre away: a linear depth
        // buffer would make far slopes flicker through each other.
        logarithmicDepthBuffer: !!real,
      }}
      camera={{ fov: 58, near: 0.5, far: farM }}
      aria-label={`Vista 3D de ${route.name}`}
    >
      <color attach="background" args={[light.horizon]} />
      <fog attach="fog" args={[light.horizon, real ? 600 : 250, fogEndM]} />
      <hemisphereLight args={light.hemi} />
      <WorldSun light={light} shadowMapPx={preset.shadowMapPx} />
      <WorldSky light={light} />
      {real ? (
        <>
          <WorldRealTerrain
            route={route}
            path={path}
            index={index}
            rh={real}
            maxVertices={preset.realTerrainVertices}
            imageryMaxPx={preset.imageryMaxPx}
            onGrid={setNearGrid}
          />
          {nearGrid && <WorldRealHorizon route={route} path={path} rh={real} near={nearGrid} />}
        </>
      ) : (
        <>
          <WorldTerrain path={path} index={index} />
          <WorldHorizon path={path} />
        </>
      )}
      <WorldRoad path={path} />
      <WorldPosts path={path} />
      <WorldGuardrails path={path} />
      <WorldSpectators path={path} index={index} motion={motion} density={preset.crowdDensity} />
      {/* With real landscape nothing is made up: no invented trees, bushes or rocks. */}
      {!real && <WorldTrees path={path} index={index} density={preset.propDensity} />}
      {!real && <WorldScenery path={path} index={index} density={preset.propDensity} />}
      <WorldRider path={path} motion={motion} />
      {ghost && <WorldRider path={path} motion={ghostMotion} ghost label={ghost.label} />}
    </Canvas>
  );
}
