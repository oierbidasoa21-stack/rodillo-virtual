import type { LandscapeTile } from '../domain/geo/landscape';
import { tileUrl } from './sources';

/** What the downloader needs from the browser; injected so it can be tested in Node. */
export interface TileStore {
  match: (url: string) => Promise<Response | undefined>;
  put: (url: string, response: Response) => Promise<void>;
}

export interface DownloadProgress {
  /** Tiles finished (downloaded, already cached or failed). */
  done: number;
  total: number;
  /** Bytes downloaded in this run (cached tiles count 0). */
  bytes: number;
  failed: number;
}

export interface DownloadResult extends DownloadProgress {
  /** Tiles that could not be downloaded; the landscape works without them. */
  failedTiles: LandscapeTile[];
  /** Stopped by the user before the end. */
  aborted: boolean;
}

export interface DownloadOptions {
  store: TileStore;
  fetch: (url: string, init: { signal?: AbortSignal }) => Promise<Response>;
  /** Requests at the same time: polite to the tile servers and enough to be quick. */
  concurrency?: number;
  signal?: AbortSignal;
  onProgress?: (p: DownloadProgress) => void;
}

/**
 * Downloads tiles into the store, skipping the ones already there, with at most
 * `concurrency` requests at once. A failed tile is reported, never retried in a
 * loop and never replaced by anything made up.
 */
export async function downloadTiles(
  tiles: readonly LandscapeTile[],
  opts: DownloadOptions,
): Promise<DownloadResult> {
  const concurrency = Math.max(1, opts.concurrency ?? 6);
  const progress: DownloadProgress = { done: 0, total: tiles.length, bytes: 0, failed: 0 };
  const failedTiles: LandscapeTile[] = [];
  let next = 0;

  const one = async (tile: LandscapeTile) => {
    const url = tileUrl(tile);
    try {
      if (!(await opts.store.match(url))) {
        const res = await opts.fetch(url, { signal: opts.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = await res.arrayBuffer();
        progress.bytes += body.byteLength;
        await opts.store.put(
          url,
          new Response(body, {
            headers: { 'Content-Type': res.headers.get('Content-Type') ?? '' },
          }),
        );
      }
    } catch {
      // Stopped by the user: not a failure, and not counted as done.
      if (opts.signal?.aborted) return;
      progress.failed += 1;
      failedTiles.push(tile);
    }
    progress.done += 1;
    opts.onProgress?.({ ...progress });
  };

  const worker = async () => {
    while (next < tiles.length && !opts.signal?.aborted) {
      const tile = tiles[next++];
      if (tile) await one(tile);
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, tiles.length) }, worker));
  return { ...progress, failedTiles, aborted: !!opts.signal?.aborted };
}
