import { type TileId, boxAround, tilesCovering } from './mercator';

/**
 * What a real landscape covers: a detailed area near the route and a coarse
 * ring for the horizon, each with its zoom for heights and for the photo.
 * Zoom 12 heights are ~30 m per pixel and zoom 14 imagery ~8 m (at 45°).
 */
export const LANDSCAPE = {
  nearMarginM: 4_000,
  farMarginM: 25_000,
  terrainNearZ: 12,
  terrainFarZ: 9,
  imageryNearZ: 14,
  imageryFarZ: 11,
} as const;

/**
 * Average size of one tile, measured on mountain tiles on 2026-11-28: Terrarium
 * PNGs weigh 135–160 KB (flat or sea tiles far less), Sentinel-2 JPEGs 15–21 KB.
 * Used only to tell the user roughly how much will be downloaded.
 */
export const TILE_BYTES = { terrain: 150_000, imagery: 20_000 } as const;

export type TileLayer = keyof typeof TILE_BYTES;

export interface LandscapeTile {
  layer: TileLayer;
  tile: TileId;
}

/** Every tile a route's landscape needs, near area first, without repeats. */
export function landscapeTiles(points: readonly { lat: number; lon: number }[]): LandscapeTile[] {
  const near = boxAround(points, LANDSCAPE.nearMarginM);
  const far = boxAround(points, LANDSCAPE.farMarginM);
  const out: LandscapeTile[] = [];
  const seen = new Set<string>();
  const add = (layer: TileLayer, tiles: TileId[]) => {
    for (const tile of tiles) {
      const key = `${layer}/${tile.z}/${tile.x}/${tile.y}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ layer, tile });
    }
  };
  add('terrain', tilesCovering(near, LANDSCAPE.terrainNearZ));
  add('imagery', tilesCovering(near, LANDSCAPE.imageryNearZ));
  add('terrain', tilesCovering(far, LANDSCAPE.terrainFarZ));
  add('imagery', tilesCovering(far, LANDSCAPE.imageryFarZ));
  return out;
}

/** Rough download size of some tiles, in bytes. */
export function estimateBytes(tiles: readonly LandscapeTile[]): number {
  return tiles.reduce((sum, t) => sum + TILE_BYTES[t.layer], 0);
}

const tileKeyOf = (t: LandscapeTile) => `${t.layer}/${t.tile.z}/${t.tile.x}/${t.tile.y}`;

/**
 * Tiles of a route's landscape that no other route's landscape uses: the ones
 * that can go when that landscape (or route) is deleted. Nearby routes share
 * tiles, and deleting one must not leave a hole in another.
 */
export function tilesOnlyIn(
  route: readonly { lat: number; lon: number }[],
  others: readonly (readonly { lat: number; lon: number }[])[],
): LandscapeTile[] {
  const kept = new Set(others.flatMap((o) => landscapeTiles(o).map(tileKeyOf)));
  return landscapeTiles(route).filter((t) => !kept.has(tileKeyOf(t)));
}
