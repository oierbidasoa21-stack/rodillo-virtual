import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { BackSide, Color, type Mesh } from 'three';

export const SKY_HORIZON = '#cfe3f2';
const SKY_ZENITH = '#5a93cf';

const vertexShader = /* glsl */ `
  varying float vHeight;
  void main() {
    vHeight = normalize(position).y;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const fragmentShader = /* glsl */ `
  uniform vec3 horizon;
  uniform vec3 zenith;
  varying float vHeight;
  void main() {
    gl_FragColor = vec4(mix(horizon, zenith, pow(max(vHeight, 0.0), 0.6)), 1.0);
  }
`;

/** A gradient sky dome that travels with the camera, so it is never reached. */
export default function WorldSky() {
  const ref = useRef<Mesh>(null);
  const uniforms = useMemo(
    () => ({
      horizon: { value: new Color(SKY_HORIZON) },
      zenith: { value: new Color(SKY_ZENITH) },
    }),
    [],
  );
  useFrame(({ camera }) => {
    ref.current?.position.copy(camera.position);
  });
  return (
    <mesh ref={ref} renderOrder={-1}>
      <sphereGeometry args={[1800, 24, 12]} />
      <shaderMaterial
        side={BackSide}
        depthWrite={false}
        fog={false}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
      />
    </mesh>
  );
}
