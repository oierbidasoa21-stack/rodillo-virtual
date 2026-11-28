import { TILE_SIZE } from '../domain/geo/mercator';
import { decodeTerrariumImage } from '../domain/geo/terrarium';

/** Pixels of an image blob, decoded by the browser (off the DOM). */
async function pixels(blob: Blob): Promise<Uint8ClampedArray> {
  const bitmap = await createImageBitmap(blob, {
    colorSpaceConversion: 'none',
    premultiplyAlpha: 'none',
  });
  try {
    if (bitmap.width !== TILE_SIZE || bitmap.height !== TILE_SIZE) {
      throw new Error(`Tile is ${bitmap.width}×${bitmap.height}, expected ${TILE_SIZE}`);
    }
    const canvas = new OffscreenCanvas(TILE_SIZE, TILE_SIZE);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('No 2D canvas');
    ctx.drawImage(bitmap, 0, 0);
    return ctx.getImageData(0, 0, TILE_SIZE, TILE_SIZE).data;
  } finally {
    bitmap.close();
  }
}

/**
 * Heights of a Terrarium tile. Colour conversion and premultiplied alpha are
 * off: either would change the RGB values that encode the height.
 */
export async function decodeTerrainTile(blob: Blob): Promise<Float32Array> {
  return decodeTerrariumImage(await pixels(blob), TILE_SIZE, TILE_SIZE);
}
