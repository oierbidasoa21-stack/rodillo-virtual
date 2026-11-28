import { landscapeTiles, tilesOnlyIn } from '../domain/geo/landscape';
import type { Route } from '../domain/route/route';
import { deleteTiles, openTileStore } from './cache';
import { type DownloadProgress, type DownloadResult, downloadTiles } from './download';

/**
 * Downloads a route's real landscape (heights and satellite photo) into the
 * tile cache. Tiles already there are skipped, so running it again only fills
 * the gaps of an earlier download.
 */
export async function downloadLandscape(
  route: Route,
  opts: { signal?: AbortSignal; onProgress?: (p: DownloadProgress) => void } = {},
): Promise<DownloadResult> {
  return downloadTiles(landscapeTiles(route.points), {
    store: await openTileStore(),
    fetch: (url, init) => fetch(url, init),
    ...opts,
  });
}

/** Deletes a route's landscape tiles, except those another downloaded landscape uses. */
export async function deleteLandscapeTiles(route: Route, others: readonly Route[]): Promise<void> {
  if (typeof caches === 'undefined') return;
  await deleteTiles(
    tilesOnlyIn(
      route.points,
      others.map((o) => o.points),
    ),
  );
}
