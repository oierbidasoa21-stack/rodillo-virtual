import { describe, expect, it } from 'vitest';
import { LANDSCAPE, TILE_BYTES, estimateBytes, landscapeTiles, tilesOnlyIn } from './landscape';
import { boxAround, tilesCovering } from './mercator';

// An invented 3 km climb in a mountain area (no real route).
const route = [
  { lat: 42.64, lon: 0.04 },
  { lat: 42.65, lon: 0.05 },
  { lat: 42.66, lon: 0.06 },
];

describe('landscape tiles', () => {
  const tiles = landscapeTiles(route);
  const count = (layer: string, z: number) =>
    tiles.filter((t) => t.layer === layer && t.tile.z === z).length;

  it('covers the near area and the horizon ring at their zooms', () => {
    const near = boxAround(route, LANDSCAPE.nearMarginM);
    const far = boxAround(route, LANDSCAPE.farMarginM);
    expect(count('terrain', 12)).toBe(tilesCovering(near, 12).length);
    expect(count('imagery', 14)).toBe(tilesCovering(near, 14).length);
    expect(count('terrain', 9)).toBe(tilesCovering(far, 9).length);
    expect(count('imagery', 11)).toBe(tilesCovering(far, 11).length);
  });

  it('starts with the near terrain and never repeats a tile', () => {
    expect(tiles[0]).toMatchObject({ layer: 'terrain', tile: { z: 12 } });
    const keys = tiles.map((t) => `${t.layer}/${t.tile.z}/${t.tile.x}/${t.tile.y}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('estimates the download from the tile counts', () => {
    const terrain = tiles.filter((t) => t.layer === 'terrain').length;
    const imagery = tiles.length - terrain;
    expect(estimateBytes(tiles)).toBe(terrain * TILE_BYTES.terrain + imagery * TILE_BYTES.imagery);
    // A short climb stays well under 10 MB: a size worth asking about, not a surprise.
    expect(estimateBytes(tiles)).toBeLessThan(10_000_000);
  });

  it('keeps tiles another landscape still uses when deleting one', () => {
    // A second invented route 2 km east shares most of its tiles with the first.
    const nearby = route.map((p) => ({ lat: p.lat, lon: p.lon + 0.025 }));
    const far = route.map((p) => ({ lat: p.lat + 3, lon: p.lon }));
    const all = landscapeTiles(route);
    const own = tilesOnlyIn(route, [nearby]);
    expect(own.length).toBeGreaterThan(0);
    expect(own.length).toBeLessThan(all.length);
    const nearbyKeys = new Set(
      landscapeTiles(nearby).map((t) => `${t.layer}/${t.tile.z}/${t.tile.x}/${t.tile.y}`),
    );
    expect(
      own.every((t) => !nearbyKeys.has(`${t.layer}/${t.tile.z}/${t.tile.x}/${t.tile.y}`)),
    ).toBe(true);
    // Nothing shared with a route 330 km away, or with no other route: all of them go.
    expect(tilesOnlyIn(route, [far])).toHaveLength(all.length);
    expect(tilesOnlyIn(route, [])).toHaveLength(all.length);
  });
});
