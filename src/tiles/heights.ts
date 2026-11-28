import { type HeightMosaic, heightMosaic } from '../domain/geo/heights';
import { LANDSCAPE, landscapeTiles } from '../domain/geo/landscape';
import type { TileId } from '../domain/geo/mercator';
import type { Route } from '../domain/route/route';
import { cachedTile } from './cache';
import { decodeTerrainTile } from './decode';

export interface RouteHeights {
  near: HeightMosaic;
  far: HeightMosaic | null;
}

/**
 * The height tiles of a GPX route that are already in the cache, decoded.
 * Null when none of the near tiles was downloaded (or for an invented route):
 * then the 3D view is the usual one. A tile that is missing or broken is left
 * out, never guessed.
 */
export async function loadRouteHeights(route: Route): Promise<RouteHeights | null> {
  if (route.source !== 'gpx' || typeof caches === 'undefined') return null;
  const tiles = landscapeTiles(route.points).filter((t) => t.layer === 'terrain');
  const decoded = await Promise.all(
    tiles.map(async (t): Promise<[TileId, Float32Array] | null> => {
      try {
        const blob = await cachedTile(t);
        return blob ? [t.tile, await decodeTerrainTile(blob)] : null;
      } catch {
        return null;
      }
    }),
  );
  const ok = decoded.filter((d): d is [TileId, Float32Array] => d !== null);
  const at = (z: number) => ok.filter(([id]) => id.z === z);
  const near = at(LANDSCAPE.terrainNearZ);
  if (!near.length) return null;
  const far = at(LANDSCAPE.terrainFarZ);
  return {
    near: heightMosaic(LANDSCAPE.terrainNearZ, near),
    far: far.length ? heightMosaic(LANDSCAPE.terrainFarZ, far) : null,
  };
}
