import { type LocalFrame, toLonLat } from './localFrame';
import { TILE_SIZE, type TileId, lonLatToTile } from './mercator';

/** A block of tiles of one zoom, laid out as one picture: `cols` × `rows` from (x0, y0). */
export interface MosaicLayout {
  z: number;
  x0: number;
  y0: number;
  cols: number;
  rows: number;
}

/** The smallest block of tiles holding all of them (they must share a zoom). */
export function layoutOf(tiles: readonly TileId[]): MosaicLayout | null {
  const first = tiles[0];
  if (!first) return null;
  let x0 = first.x;
  let x1 = first.x;
  let y0 = first.y;
  let y1 = first.y;
  for (const t of tiles) {
    if (t.z !== first.z) throw new Error('layoutOf: tiles of different zooms');
    x0 = Math.min(x0, t.x);
    x1 = Math.max(x1, t.x);
    y0 = Math.min(y0, t.y);
    y1 = Math.max(y1, t.y);
  }
  return { z: first.z, x0, y0, cols: x1 - x0 + 1, rows: y1 - y0 + 1 };
}

/**
 * Pixels per tile when the whole mosaic must fit in a `maxPx` square texture:
 * the tiles' own 256 px if it fits, fewer if not (never less than 16).
 */
export function tilePx(layout: MosaicLayout, maxPx: number): number {
  return Math.max(16, Math.min(TILE_SIZE, Math.floor(maxPx / Math.max(layout.cols, layout.rows))));
}

/**
 * Texture coordinates of each vertex (x, y, z triplets in world metres) on the
 * mosaic picture: u grows east, v grows south from the top row (the texture is
 * uploaded without flipping). Vertices outside the mosaic get coordinates
 * outside 0…1, which the texture clamps to its edge.
 */
export function mosaicUvs(
  positions: ArrayLike<number>,
  frame: LocalFrame,
  layout: MosaicLayout,
): Float32Array {
  const n = Math.floor(positions.length / 3);
  const uvs = new Float32Array(n * 2);
  for (let v = 0; v < n; v++) {
    const { lon, lat } = toLonLat(frame, positions[v * 3] ?? 0, positions[v * 3 + 2] ?? 0);
    const t = lonLatToTile(lon, lat, layout.z);
    uvs[v * 2] = (t.x - layout.x0) / layout.cols;
    uvs[v * 2 + 1] = (t.y - layout.y0) / layout.rows;
  }
  return uvs;
}
