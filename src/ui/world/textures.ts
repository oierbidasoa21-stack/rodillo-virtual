import {
  DataTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  RGBAFormat,
  RepeatWrapping,
  SRGBColorSpace,
} from 'three';
import { rng } from '../../domain/world/terrain';

/**
 * Seamless value noise on a `size`-pixel tile: random values on a `cells`-wide
 * grid that wraps around, smoothly interpolated. Returns 0..1 per pixel.
 */
function tileNoise(size: number, cells: number, seed: number): Float32Array {
  const rand = rng(seed);
  const grid = Array.from({ length: cells * cells }, () => rand());
  const at = (i: number, j: number) => grid[(j % cells) * cells + (i % cells)] ?? 0;
  const out = new Float32Array(size * size);
  const step = cells / size;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const gx = x * step;
      const gy = y * step;
      const i = Math.floor(gx);
      const j = Math.floor(gy);
      const fx = gx - i;
      const fy = gy - j;
      const sx = fx * fx * (3 - 2 * fx);
      const sy = fy * fy * (3 - 2 * fy);
      const top = at(i, j) + (at(i + 1, j) - at(i, j)) * sx;
      const bottom = at(i, j + 1) + (at(i + 1, j + 1) - at(i, j + 1)) * sx;
      out[y * size + x] = top + (bottom - top) * sy;
    }
  }
  return out;
}

/** Several octaves of tile noise, weighted, summed to 0..1. */
function fbm(size: number, octaves: [cells: number, weight: number][], seed: number): Float32Array {
  const out = new Float32Array(size * size);
  const total = octaves.reduce((s, [, w]) => s + w, 0);
  octaves.forEach(([cells, w], k) => {
    const n = tileNoise(size, cells, seed + k * 101);
    for (let i = 0; i < out.length; i++) out[i] = (out[i] ?? 0) + ((n[i] ?? 0) * w) / total;
  });
  return out;
}

function toTexture(size: number, rgb: (i: number) => [number, number, number]): DataTexture {
  const data = new Uint8Array(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    const [r, g, b] = rgb(i);
    data.set([r * 255, g * 255, b * 255, 255], i * 4);
  }
  const t = new DataTexture(data, size, size, RGBAFormat);
  t.wrapS = RepeatWrapping;
  t.wrapT = RepeatWrapping;
  t.colorSpace = SRGBColorSpace;
  t.generateMipmaps = true;
  t.minFilter = LinearMipmapLinearFilter;
  t.magFilter = LinearFilter;
  t.anisotropy = 8; // Three.js clamps it to what the GPU supports.
  t.needsUpdate = true;
  return t;
}

/** Asphalt: grey with fine aggregate grain and faint darker patches. */
export function asphaltTexture(size = 256): DataTexture {
  const rand = rng(11);
  const patches = fbm(
    size,
    [
      [4, 1],
      [8, 0.6],
    ],
    21,
  );
  return toTexture(size, (i) => {
    const grain = rand();
    // Most grains near the base tone, a few light stones and dark pits.
    const stone = grain > 0.97 ? 0.12 : grain < 0.04 ? -0.08 : (grain - 0.5) * 0.08;
    const v = 0.36 + stone - ((patches[i] ?? 0) - 0.5) * 0.1;
    return [v, v, v * 1.03];
  });
}

/**
 * Grass detail, near white so it only modulates the ground's own colour
 * (which varies with height): clumps, blades and a hint of yellow.
 */
export function grassTexture(size = 256): DataTexture {
  const rand = rng(31);
  const clumps = fbm(
    size,
    [
      [4, 1],
      [16, 0.8],
      [64, 0.5],
    ],
    41,
  );
  return toTexture(size, (i) => {
    const c = clumps[i] ?? 0.5;
    const blade = (rand() - 0.5) * 0.12;
    const v = 0.78 + (c - 0.5) * 0.35 + blade;
    const dry = Math.max(0, c - 0.62) * 0.6; // a little straw in the light clumps
    return [Math.min(1, v + dry), Math.min(1, v + dry * 0.6), Math.max(0, v - dry * 0.6)];
  });
}
