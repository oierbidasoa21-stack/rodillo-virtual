import type { LandscapeTile } from '../domain/geo/landscape';
import type { TileStore } from './download';
import { tileUrl } from './sources';

/** Cache Storage bucket for landscape tiles (separate from the app's own caches). */
export const TILE_CACHE = 'rodillo-virtual-tiles';

/** The tile cache as a TileStore. Needs a secure context (HTTPS or localhost). */
export async function openTileStore(): Promise<TileStore> {
  const cache = await caches.open(TILE_CACHE);
  return {
    match: (url) => cache.match(url),
    put: (url, response) => cache.put(url, response),
  };
}

/** A tile from the cache, or null if it was never downloaded (or failed). */
export async function cachedTile(tile: LandscapeTile): Promise<Blob | null> {
  const cache = await caches.open(TILE_CACHE);
  const res = await cache.match(tileUrl(tile));
  return res ? res.blob() : null;
}

/** Removes some tiles from the cache (a route's landscape, when the user deletes it). */
export async function deleteTiles(tiles: readonly LandscapeTile[]): Promise<void> {
  const cache = await caches.open(TILE_CACHE);
  await Promise.all(tiles.map((t) => cache.delete(tileUrl(t))));
}
