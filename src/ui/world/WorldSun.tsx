import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { type DirectionalLight, Vector3 } from 'three';
import type { Lighting } from './sun';

/** Half the side of the square that gets sharp shadows, in metres. */
const SHADOW_HALF_M = 40;

/**
 * The sun: a directional light whose shadow box follows the camera, so the
 * rider, posts and nearby trees cast shadows without a huge shadow map.
 */
export default function WorldSun({
  light: lighting,
  shadowMapPx,
}: {
  light: Lighting;
  shadowMapPx: number;
}) {
  const light = useRef<DirectionalLight>(null);
  const tmp = useRef({ fwd: new Vector3(), centre: new Vector3() });

  useFrame(({ camera }) => {
    const l = light.current;
    if (!l) return;
    const { fwd, centre } = tmp.current;
    camera.getWorldDirection(fwd);
    fwd.y = 0;
    fwd.normalize();
    // Centre the box a bit ahead of the camera (where the rider is), snapped to
    // whole shadow texels so the shadow edges do not shimmer while riding.
    const texel = (SHADOW_HALF_M * 2) / shadowMapPx;
    centre.copy(camera.position).addScaledVector(fwd, 15);
    centre.set(
      Math.round(centre.x / texel) * texel,
      Math.round(centre.y / texel) * texel,
      Math.round(centre.z / texel) * texel,
    );
    l.target.position.copy(centre);
    l.target.updateMatrixWorld();
    l.position.copy(centre).addScaledVector(lighting.sunDirection, 300);
  });

  return (
    <directionalLight
      ref={light}
      castShadow
      color={lighting.sunColor}
      intensity={lighting.sunIntensity}
      shadow-mapSize={[shadowMapPx, shadowMapPx]}
      shadow-camera-left={-SHADOW_HALF_M}
      shadow-camera-right={SHADOW_HALF_M}
      shadow-camera-top={SHADOW_HALF_M}
      shadow-camera-bottom={-SHADOW_HALF_M}
      shadow-camera-near={100}
      shadow-camera-far={500}
      shadow-bias={-0.0004}
      shadow-normalBias={0.04}
    />
  );
}
