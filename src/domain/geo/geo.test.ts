import { describe, expect, it } from 'vitest';
import {
  TILE_SIZE,
  boxAround,
  lonLatToTile,
  metresPerPixel,
  tileToLonLat,
  tilesCovering,
} from './mercator';
import { decodeTerrarium, decodeTerrariumImage } from './terrarium';
import { heightMosaic, sampleHeight } from './heights';
import { EARTH_RADIUS_M, frameOf, toLocal, toLonLat } from './localFrame';

describe('web mercator', () => {
  it('puts known points on the right tile (hand-checked)', () => {
    // Zoom 1: the world is 2×2 tiles and (0°, 0°) is their shared corner.
    expect(lonLatToTile(0, 0, 1)).toEqual({ x: 1, y: 1 });
    // Zoom 2, lon 90°: (90 + 180) / 360 · 4 = 3; on the equator y = 4 / 2 = 2.
    const p = lonLatToTile(90, 0, 2);
    expect(p.x).toBeCloseTo(3, 12);
    expect(p.y).toBeCloseTo(2, 12);
    // The north-west corner of the map.
    const nw = lonLatToTile(-180, 85.0511287798, 3);
    expect(nw.x).toBeCloseTo(0, 9);
    expect(nw.y).toBeCloseTo(0, 6);
  });

  it('goes back from tile to lon/lat', () => {
    for (const [lon, lat] of [
      [-3.7, 40.4],
      [2.17, 41.39],
      [-122.4, 37.8],
      [151.2, -33.9],
    ] as const) {
      const t = lonLatToTile(lon, lat, 13);
      const back = tileToLonLat(t.x, t.y, 13);
      expect(back.lon).toBeCloseTo(lon, 9);
      expect(back.lat).toBeCloseTo(lat, 9);
    }
  });

  it('lists the tiles covering a box, row by row', () => {
    // Zoom 2: lon −10…100 spans tiles x 1…3; lat −10…10 spans rows y 1…2.
    const tiles = tilesCovering({ west: -10, east: 100, south: -10, north: 10 }, 2);
    expect(tiles.map((t) => `${t.x},${t.y}`)).toEqual(['1,1', '2,1', '3,1', '1,2', '2,2', '3,2']);
  });

  it('grows a box by a margin in metres', () => {
    const box = boxAround([{ lat: 0, lon: 0 }], 111_195);
    // 111 195 m is one degree on a 6371 km sphere (2π·R/360).
    expect(box.north).toBeCloseTo(1, 3);
    expect(box.south).toBeCloseTo(-1, 3);
    expect(box.east).toBeCloseTo(1, 3);
    expect(() => boxAround([], 10)).toThrow();
  });

  it('gives the ground size of a pixel', () => {
    // Equator, zoom 0: the whole circumference over 256 px.
    expect(metresPerPixel(0, 0)).toBeCloseTo((2 * Math.PI * EARTH_RADIUS_M) / TILE_SIZE, 6);
    // Zoom 12 at 60°: halved by the cosine, and 4096 times smaller.
    expect(metresPerPixel(12, 60)).toBeCloseTo(metresPerPixel(0, 0) / 2 / 4096, 6);
  });
});

describe('terrarium', () => {
  it('decodes heights (hand-checked)', () => {
    // 128·256 = 32768 → sea level.
    expect(decodeTerrarium(128, 0, 0)).toBe(0);
    // 128·256 + 100 + 128/256 − 32768 = 100.5 m.
    expect(decodeTerrarium(128, 100, 128)).toBe(100.5);
    // Below sea level: 127·256 + 255 − 32768 = −1 m.
    expect(decodeTerrarium(127, 255, 0)).toBe(-1);
  });

  it('decodes a whole RGBA image and ignores alpha', () => {
    const rgba = [128, 0, 0, 255, 128, 10, 0, 0];
    expect(Array.from(decodeTerrariumImage(rgba, 2, 1))).toEqual([0, 10]);
    expect(() => decodeTerrariumImage([1, 2, 3], 1, 1)).toThrow();
  });
});

describe('height mosaic', () => {
  // One zoom-1 tile (x 1, y 1: the south-east quarter of the world) where the
  // height is 10·column + 1000·row, so bilinear results are easy to check.
  const tile = new Float32Array(TILE_SIZE * TILE_SIZE);
  for (let r = 0; r < TILE_SIZE; r++)
    for (let c = 0; c < TILE_SIZE; c++) tile[r * TILE_SIZE + c] = 10 * c + 1000 * r;
  const mosaic = heightMosaic(1, [[{ z: 1, x: 1, y: 1 }, tile]]);
  const at = (px: number, py: number) => {
    // Global pixel position → lon/lat (tile 1,1 starts at pixel 256,256).
    const { lon, lat } = tileToLonLat(
      (TILE_SIZE + px) / TILE_SIZE,
      (TILE_SIZE + py) / TILE_SIZE,
      1,
    );
    return sampleHeight(mosaic, lon, lat);
  };

  it('returns a pixel height at its centre', () => {
    // Centre of pixel (column 3, row 2): 30 + 2000.
    expect(at(3.5, 2.5)).toBeCloseTo(2030, 3);
  });

  it('interpolates between four pixel centres (hand-checked)', () => {
    // Halfway between columns 3 and 4 and rows 2 and 3: (30 + 40) / 2 + (2000 + 3000) / 2.
    expect(at(4, 3)).toBeCloseTo(2535, 3);
  });

  it('gives null where a pixel is missing instead of guessing', () => {
    // Next to the tile's west edge the neighbour tile (0, 1) is not loaded.
    expect(at(0.2, 10.5)).toBeNull();
    // Northern hemisphere: no tile at all.
    expect(sampleHeight(mosaic, 10, 10)).toBeNull();
  });

  it('refuses tiles of another zoom or size', () => {
    expect(() => heightMosaic(2, [[{ z: 1, x: 0, y: 0 }, tile]])).toThrow();
    expect(() => heightMosaic(1, [[{ z: 1, x: 0, y: 0 }, new Float32Array(4)]])).toThrow();
  });
});

describe('local frame', () => {
  it('is centred on the average point', () => {
    expect(
      frameOf([
        { lat: 40, lon: -4 },
        { lat: 42, lon: -2 },
      ]),
    ).toEqual({ lat0: 41, lon0: -3 });
  });

  it('measures metres east and south (hand-checked)', () => {
    const f = { lat0: 0, lon0: 0 };
    // One degree north on the equator: 2π·6 371 000 / 360 ≈ 111 195 m, as −z.
    const n = toLocal(f, 0, 1);
    expect(n.x).toBeCloseTo(0, 9);
    expect(n.z).toBeCloseTo(-111_194.93, 1);
    // At 60° a degree of longitude is half as long.
    expect(toLocal({ lat0: 60, lon0: 0 }, 1, 60).x).toBeCloseTo(111_194.93 / 2, 1);
  });

  it('goes back from metres to lon/lat', () => {
    const f = { lat0: 43.2, lon0: -2.9 };
    const { x, z } = toLocal(f, -2.85, 43.23);
    const back = toLonLat(f, x, z);
    expect(back.lon).toBeCloseTo(-2.85, 10);
    expect(back.lat).toBeCloseTo(43.23, 10);
  });
});
