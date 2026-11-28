import { TILE_SIZE, type TileId, lonLatToTile } from './mercator';

/**
 * Heights of several tiles of the same zoom, decoded (one Float32Array of
 * TILE_SIZE² per tile). A tile that could not be loaded is simply missing.
 */
export interface HeightMosaic {
  z: number;
  tiles: ReadonlyMap<string, Float32Array>;
}

export const tileKey = (t: Pick<TileId, 'x' | 'y'>) => `${t.x}/${t.y}`;

export function heightMosaic(z: number, tiles: Iterable<[TileId, Float32Array]>): HeightMosaic {
  const map = new Map<string, Float32Array>();
  for (const [id, heights] of tiles) {
    if (id.z !== z) throw new Error(`heightMosaic: tile at zoom ${id.z}, mosaic at ${z}`);
    if (heights.length !== TILE_SIZE * TILE_SIZE) throw new Error('heightMosaic: wrong tile size');
    map.set(tileKey(id), heights);
  }
  return { z, tiles: map };
}

/** Height of one pixel in global pixel coordinates, or null if its tile is missing. */
function pixel(m: HeightMosaic, gx: number, gy: number): number | null {
  const tx = Math.floor(gx / TILE_SIZE);
  const ty = Math.floor(gy / TILE_SIZE);
  const tile = m.tiles.get(`${tx}/${ty}`);
  if (!tile) return null;
  const px = gx - tx * TILE_SIZE;
  const py = gy - ty * TILE_SIZE;
  return tile[py * TILE_SIZE + px] ?? null;
}

/**
 * Height at a lon/lat, interpolated between the four nearest pixel centres
 * (bilinear), across tile edges too. Null where any of those pixels is missing:
 * the caller decides what to show, nothing is guessed here.
 */
export function sampleHeight(m: HeightMosaic, lon: number, lat: number): number | null {
  const t = lonLatToTile(lon, lat, m.z);
  // Pixel centres sit at .5: shift so integer coordinates are centres.
  const fx = t.x * TILE_SIZE - 0.5;
  const fy = t.y * TILE_SIZE - 0.5;
  const x0 = Math.floor(fx);
  const y0 = Math.floor(fy);
  const u = fx - x0;
  const v = fy - y0;
  const h00 = pixel(m, x0, y0);
  const h10 = pixel(m, x0 + 1, y0);
  const h01 = pixel(m, x0, y0 + 1);
  const h11 = pixel(m, x0 + 1, y0 + 1);
  if (h00 === null || h10 === null || h01 === null || h11 === null) return null;
  return (h00 * (1 - u) + h10 * u) * (1 - v) + (h01 * (1 - u) + h11 * u) * v;
}
