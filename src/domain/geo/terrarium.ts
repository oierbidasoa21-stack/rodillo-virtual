/**
 * Terrarium elevation encoding (AWS Terrain Tiles): each pixel stores the height
 * as R·256 + G + B/256 − 32768 metres.
 */
export function decodeTerrarium(r: number, g: number, b: number): number {
  return r * 256 + g + b / 256 - 32768;
}

/** Heights of a whole RGBA image (4 bytes per pixel, alpha ignored), row by row. */
export function decodeTerrariumImage(
  rgba: ArrayLike<number>,
  width: number,
  height: number,
): Float32Array {
  if (rgba.length < width * height * 4) throw new Error('decodeTerrariumImage: image too short');
  const out = new Float32Array(width * height);
  for (let i = 0; i < out.length; i++) {
    out[i] = decodeTerrarium(rgba[i * 4] ?? 0, rgba[i * 4 + 1] ?? 0, rgba[i * 4 + 2] ?? 0);
  }
  return out;
}
