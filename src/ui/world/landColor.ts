import { BufferAttribute, type BufferGeometry, Color } from 'three';
import { valueNoise } from '../../domain/world/terrain';

const GREEN = new Color(0.36, 0.5, 0.28);
const ROCK = new Color(0.5, 0.48, 0.44);

/**
 * Neutral colour for real ground until the satellite photo covers it (#25):
 * green where it is gentle, grey rock where it is steep. Only the slope, which
 * is real; no snow, forest or anything else guessed from the altitude.
 */
export function paintBySlope(geometry: BufferGeometry, noiseScaleM: number): void {
  const pos = geometry.getAttribute('position');
  const normal = geometry.getAttribute('normal');
  if (!pos || !normal) return;
  const colors = new Float32Array(pos.count * 3);
  const c = new Color();
  for (let v = 0; v < pos.count; v++) {
    // normal.y is the cosine of the slope: 1 flat, 0.7 at 45°.
    const steep = Math.min(1, Math.max(0, (0.92 - normal.getY(v)) / 0.25));
    const n = valueNoise(pos.getX(v) / noiseScaleM, pos.getZ(v) / noiseScaleM, 5);
    c.copy(GREEN)
      .lerp(ROCK, steep)
      .multiplyScalar(0.9 + 0.2 * n);
    colors.set([c.r, c.g, c.b], v * 3);
  }
  geometry.setAttribute('color', new BufferAttribute(colors, 3));
}
