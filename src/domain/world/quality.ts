/** How much the 3D view draws: lower levels for slower laptops. */
export type GraphicsQuality = 'low' | 'medium' | 'high';

export const GRAPHICS_QUALITIES: readonly GraphicsQuality[] = ['low', 'medium', 'high'];

export const GRAPHICS_QUALITY_LABEL: Record<GraphicsQuality, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
};

export interface QualityPreset {
  /** Sun shadows on or off. */
  shadows: boolean;
  /** Side of the shadow map, in pixels. */
  shadowMapPx: number;
  /** Highest device pixel ratio the canvas renders at. */
  maxDpr: number;
  antialias: boolean;
  /** Share (0–1) of the trees, bushes and rocks that are drawn. */
  propDensity: number;
  /** Share (0–1) of the spectators that are drawn. */
  crowdDensity: number;
  /** Far plane of the camera, in metres: nothing further is drawn. */
  farM: number;
  /** Where the haze becomes solid, in metres (just inside `farM`). */
  fogEndM: number;
  /** With real landscape (phase 10): vertices of the near real terrain. */
  realTerrainVertices: number;
  /** With real landscape: far plane, to see the real horizon (up to 25 km away). */
  realFarM: number;
  /** With real landscape: where the haze becomes solid. */
  realFogEndM: number;
}

/** "Alta" is what the 3D view drew before there was a choice. */
export const QUALITY_PRESETS: Record<GraphicsQuality, QualityPreset> = {
  low: {
    shadows: false,
    shadowMapPx: 512,
    maxDpr: 1,
    antialias: false,
    propDensity: 0.35,
    crowdDensity: 0.3,
    farM: 2500,
    fogEndM: 2200,
    realTerrainVertices: 40_000,
    realFarM: 9_000,
    realFogEndM: 8_000,
  },
  medium: {
    shadows: true,
    shadowMapPx: 1024,
    maxDpr: 1.25,
    antialias: true,
    propDensity: 0.65,
    crowdDensity: 0.6,
    farM: 5000,
    fogEndM: 4200,
    realTerrainVertices: 90_000,
    realFarM: 16_000,
    realFogEndM: 14_000,
  },
  high: {
    shadows: true,
    shadowMapPx: 2048,
    maxDpr: 1.5,
    antialias: true,
    propDensity: 1,
    crowdDensity: 1,
    farM: 8000,
    fogEndM: 6000,
    realTerrainVertices: 160_000,
    realFarM: 27_000,
    realFogEndM: 25_000,
  },
};

export function isGraphicsQuality(v: unknown): v is GraphicsQuality {
  return v === 'low' || v === 'medium' || v === 'high';
}

/**
 * Keeps about `density` (0–1) of the items, always the same ones for the same
 * list, spread evenly along it (items are scattered along the road, so taking
 * the first ones would leave the end of the route bare).
 */
export function thin<T>(items: readonly T[], density: number): T[] {
  if (density >= 1) return items.slice();
  if (density <= 0) return [];
  // Golden-ratio sequence: low discrepancy, so the kept items are evenly spaced.
  return items.filter((_, i) => (i * 0.6180339887498949) % 1 < density);
}
