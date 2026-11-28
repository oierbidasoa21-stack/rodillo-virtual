import { type MosaicLayout, layoutOf, tilePx } from '../domain/geo/imagery';
import { landscapeTiles } from '../domain/geo/landscape';
import type { Route } from '../domain/route/route';
import { cachedTile } from './cache';

/** Neutral ground colour under tiles that are missing: no invented detail. */
export const NO_IMAGE_COLOUR = '#76835f';

export interface MosaicPicture {
  canvas: OffscreenCanvas;
  layout: MosaicLayout;
  /** Pixels per tile in the picture. */
  tilePx: number;
  /** Tiles of the block that were not in the cache (drawn in the neutral colour). */
  missing: number;
}

/**
 * The satellite tiles of a GPX route at zoom `z`, already in the cache, drawn
 * into one picture no larger than `maxPx` a side. Null when none was
 * downloaded: then the terrain keeps its plain colour.
 */
export async function loadRouteImagery(
  route: Route,
  z: number,
  maxPx: number,
): Promise<MosaicPicture | null> {
  if (route.source !== 'gpx' || typeof caches === 'undefined') return null;
  const tiles = landscapeTiles(route.points).filter((t) => t.layer === 'imagery' && t.tile.z === z);
  const layout = layoutOf(tiles.map((t) => t.tile));
  if (!layout) return null;
  const px = tilePx(layout, maxPx);
  const canvas = new OffscreenCanvas(layout.cols * px, layout.rows * px);
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.fillStyle = NO_IMAGE_COLOUR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  let drawn = 0;
  await Promise.all(
    tiles.map(async (t) => {
      try {
        const blob = await cachedTile(t);
        if (!blob) return;
        const bitmap = await createImageBitmap(blob, {
          resizeWidth: px,
          resizeHeight: px,
          resizeQuality: 'high',
        });
        ctx.drawImage(bitmap, (t.tile.x - layout.x0) * px, (t.tile.y - layout.y0) * px);
        bitmap.close();
        drawn++;
      } catch {
        // A broken tile stays in the neutral colour.
      }
    }),
  );
  if (!drawn) return null;
  return { canvas, layout, tilePx: px, missing: layout.cols * layout.rows - drawn };
}
