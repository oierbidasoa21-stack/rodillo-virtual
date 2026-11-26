import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { BackSide, Color, type Mesh, type ShaderMaterial } from 'three';
import { SUN_DIRECTION } from './sun';

export const SKY_HORIZON = '#cfe3f2';
const SKY_ZENITH = '#4f8bcb';

const vertexShader = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
// Gradient, sun disc with a halo, and soft clouds from a few octaves of noise.
const fragmentShader = /* glsl */ `
  uniform vec3 horizon;
  uniform vec3 zenith;
  uniform vec3 sunDir;
  uniform float time;
  varying vec3 vDir;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
    return v;
  }

  void main() {
    vec3 dir = normalize(vDir);
    float h = max(dir.y, 0.0);
    vec3 col = mix(horizon, zenith, pow(h, 0.55));

    float s = max(dot(dir, sunDir), 0.0);
    col += vec3(1.0, 0.92, 0.75) * (pow(s, 8.0) * 0.18 + pow(s, 64.0) * 0.35);
    col = mix(col, vec3(1.0, 0.98, 0.9), smoothstep(0.9993, 0.9997, s));

    if (dir.y > 0.0) {
      vec2 uv = dir.xz / (dir.y + 0.12) * 1.6 + vec2(time * 0.004, time * 0.0015);
      float c = smoothstep(0.52, 0.8, fbm(uv));
      float shade = 0.82 + 0.18 * fbm(uv * 2.0 + 3.0);
      float fade = smoothstep(0.0, 0.18, dir.y);
      col = mix(col, vec3(shade) * vec3(1.0, 0.99, 0.97), c * fade * 0.85);
    }
    gl_FragColor = vec4(col, 1.0);
  }
`;

/** A sky dome with sun and clouds that travels with the camera, so it is never reached. */
export default function WorldSky() {
  const ref = useRef<Mesh>(null);
  const material = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      horizon: { value: new Color(SKY_HORIZON) },
      zenith: { value: new Color(SKY_ZENITH) },
      sunDir: { value: SUN_DIRECTION.clone() },
      time: { value: 0 },
    }),
    [],
  );
  useFrame(({ camera, clock }) => {
    ref.current?.position.copy(camera.position);
    const time = material.current?.uniforms.time;
    if (time) time.value = clock.elapsedTime;
  });
  return (
    <mesh ref={ref} renderOrder={-1}>
      <sphereGeometry args={[1800, 32, 16]} />
      <shaderMaterial
        ref={material}
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
