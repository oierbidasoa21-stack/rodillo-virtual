import { describe, expect, it } from 'vitest';
import { layoutOf, mosaicUvs, tilePx } from './imagery';
import { toLocal } from './localFrame';
import { tileToLonLat } from './mercator';

describe('imagery mosaic', () => {
  const tiles = [
    { z: 14, x: 8194, y: 6042 },
    { z: 14, x: 8196, y: 6041 },
    { z: 14, x: 8195, y: 6044 },
  ];
  const layout = layoutOf(tiles)!;

  it('lays tiles out as one block', () => {
    // x 8194…8196 and y 6041…6044: 3 columns, 4 rows from (8194, 6041).
    expect(layout).toEqual({ z: 14, x0: 8194, y0: 6041, cols: 3, rows: 4 });
    expect(layoutOf([])).toBeNull();
    expect(() => layoutOf([tiles[0]!, { z: 13, x: 1, y: 1 }])).toThrow();
  });

  it('shrinks tiles only when the mosaic does not fit the texture', () => {
    // 4 rows × 256 = 1024 px fits in 2048; in 512 each tile gets 128 px.
    expect(tilePx(layout, 2048)).toBe(256);
    expect(tilePx(layout, 512)).toBe(128);
    expect(tilePx({ ...layout, cols: 1000 }, 2048)).toBe(16);
  });

  it('maps tile corners and centres to the right spot on the picture (hand-checked)', () => {
    const frame = { lat0: 42.65, lon0: 0.05 };
    // The north-west corner of the mosaic → (0, 0); the centre of tile (8195, 6043) → column
    // 1.5 of 3 and row 2.5 of 4 → (0.5, 0.625); the south-east corner → (1, 1).
    const spots = [
      tileToLonLat(8194, 6041, 14),
      tileToLonLat(8195.5, 6043.5, 14),
      tileToLonLat(8197, 6045, 14),
    ];
    const positions = spots.flatMap((p) => {
      const { x, z } = toLocal(frame, p.lon, p.lat);
      return [x, 123, z];
    });
    const uvs = Array.from(mosaicUvs(positions, frame, layout));
    const expected = [0, 0, 0.5, 0.625, 1, 1];
    uvs.forEach((u, i) => expect(u).toBeCloseTo(expected[i]!, 9));
  });
});
