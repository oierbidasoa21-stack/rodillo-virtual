import { describe, expect, it } from 'vitest';
import type { LandscapeTile } from '../domain/geo/landscape';
import { type TileStore, downloadTiles } from './download';
import { tileUrl } from './sources';

const tiles: LandscapeTile[] = Array.from({ length: 10 }, (_, i) => ({
  layer: i % 2 ? 'imagery' : 'terrain',
  tile: { z: 12, x: 2048 + i, y: 1510 },
}));

function memoryStore(initial: string[] = []): TileStore & { urls: Set<string> } {
  const urls = new Set(initial);
  return {
    urls,
    match: async (url) => (urls.has(url) ? new Response('cached') : undefined),
    put: async (url) => void urls.add(url),
  };
}

describe('tile download', () => {
  it('downloads every tile, never more than `concurrency` at once', async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    const store = memoryStore();
    const seen: number[] = [];
    const result = await downloadTiles(tiles, {
      store,
      concurrency: 3,
      onProgress: (p) => seen.push(p.done),
      fetch: async () => {
        inFlight++;
        maxInFlight = Math.max(maxInFlight, inFlight);
        await new Promise((r) => setTimeout(r, 2));
        inFlight--;
        return new Response(new Uint8Array(100));
      },
    });
    expect(maxInFlight).toBe(3);
    expect(result).toMatchObject({ done: 10, total: 10, bytes: 1000, failed: 0, aborted: false });
    expect(store.urls.size).toBe(10);
    expect(seen.at(-1)).toBe(10);
  });

  it('skips tiles already in the cache', async () => {
    const fetched: string[] = [];
    const store = memoryStore([tileUrl(tiles[0]!), tileUrl(tiles[1]!)]);
    const result = await downloadTiles(tiles, {
      store,
      fetch: async (url) => {
        fetched.push(url);
        return new Response(new Uint8Array(10));
      },
    });
    expect(fetched).toHaveLength(8);
    expect(result).toMatchObject({ done: 10, bytes: 80 });
  });

  it('reports failed tiles and keeps going', async () => {
    const result = await downloadTiles(tiles, {
      store: memoryStore(),
      fetch: async (url) =>
        url === tileUrl(tiles[3]!)
          ? new Response('nope', { status: 404 })
          : url === tileUrl(tiles[4]!)
            ? Promise.reject(new TypeError('network'))
            : new Response(new Uint8Array(1)),
    });
    expect(result).toMatchObject({ done: 10, failed: 2 });
    expect(result.failedTiles).toEqual([tiles[3], tiles[4]]);
  });

  it('stops when aborted and does not count the cut tiles as failures', async () => {
    const ctrl = new AbortController();
    let calls = 0;
    const result = await downloadTiles(tiles, {
      store: memoryStore(),
      concurrency: 2,
      signal: ctrl.signal,
      fetch: async (_url, { signal }) => {
        calls++;
        if (calls === 3) ctrl.abort();
        if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
        return new Response(new Uint8Array(1));
      },
    });
    expect(result.aborted).toBe(true);
    expect(result.failed).toBe(0);
    expect(result.done).toBeLessThan(10);
    expect(calls).toBeLessThan(10);
  });

  it('asks the two allowed hosts only', () => {
    const hosts = new Set(tiles.map((t) => new URL(tileUrl(t)).host));
    expect([...hosts].sort()).toEqual([
      'elevation-tiles-prod.s3.amazonaws.com',
      'tiles.maps.eox.at',
    ]);
    // WMTS: row (y) before column (x).
    expect(tileUrl({ layer: 'imagery', tile: { z: 14, x: 8194, y: 6042 } })).toMatch(
      /\/14\/6042\/8194\.jpg$/,
    );
  });
});
