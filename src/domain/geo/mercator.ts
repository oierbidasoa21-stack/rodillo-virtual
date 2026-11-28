/** Web Mercator tiles (the "slippy map" scheme used by OSM, AWS Terrain Tiles and EOX). */

/** Latitude where Web Mercator stops (the map is a square). */
export const MAX_LAT = 85.0511287798;
/** Pixels per side of a tile. */
export const TILE_SIZE = 256;

export interface TileId {
  z: number;
  x: number;
  y: number;
}

export interface LonLatBox {
  west: number;
  south: number;
  east: number;
  north: number;
}

const rad = (deg: number) => (deg * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;
const clampLat = (lat: number) => Math.max(-MAX_LAT, Math.min(MAX_LAT, lat));

/**
 * Position in tile units at zoom `z` (fractional: 3.25 is a quarter into tile 3).
 * x grows east from lon −180, y grows south from lat +85.05.
 */
export function lonLatToTile(lon: number, lat: number, z: number): { x: number; y: number } {
  const n = 2 ** z;
  const phi = rad(clampLat(lat));
  return {
    x: ((lon + 180) / 360) * n,
    y: ((1 - Math.log(Math.tan(phi) + 1 / Math.cos(phi)) / Math.PI) / 2) * n,
  };
}

/** Inverse of `lonLatToTile`: the lon/lat of a (fractional) tile position. */
export function tileToLonLat(x: number, y: number, z: number): { lon: number; lat: number } {
  const n = 2 ** z;
  return {
    lon: (x / n) * 360 - 180,
    lat: deg(Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n)))),
  };
}

/** Tiles at zoom `z` that touch the box, row by row from the north-west. */
export function tilesCovering(box: LonLatBox, z: number): TileId[] {
  const n = 2 ** z;
  const a = lonLatToTile(box.west, box.north, z);
  const b = lonLatToTile(box.east, box.south, z);
  const x0 = Math.max(0, Math.floor(a.x));
  const x1 = Math.min(n - 1, Math.floor(b.x));
  const y0 = Math.max(0, Math.floor(a.y));
  const y1 = Math.min(n - 1, Math.floor(b.y));
  const out: TileId[] = [];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push({ z, x, y });
  return out;
}

const EARTH_RADIUS_M = 6_371_000;

/** Box around some points, grown by `marginM` metres on every side. */
export function boxAround(
  points: readonly { lat: number; lon: number }[],
  marginM: number,
): LonLatBox {
  let west = Infinity;
  let east = -Infinity;
  let south = Infinity;
  let north = -Infinity;
  for (const p of points) {
    west = Math.min(west, p.lon);
    east = Math.max(east, p.lon);
    south = Math.min(south, p.lat);
    north = Math.max(north, p.lat);
  }
  if (!Number.isFinite(west)) throw new Error('boxAround: no points');
  const dLat = deg(marginM / EARTH_RADIUS_M);
  // The widest lon margin is needed at the latitude closest to a pole.
  const cosLat = Math.cos(rad(Math.max(Math.abs(south), Math.abs(north))));
  const dLon = deg(marginM / (EARTH_RADIUS_M * Math.max(cosLat, 1e-6)));
  return {
    west: Math.max(-180, west - dLon),
    east: Math.min(180, east + dLon),
    south: clampLat(south - dLat),
    north: clampLat(north + dLat),
  };
}

/** Ground size of one pixel at zoom `z` and latitude `lat`, in metres. */
export function metresPerPixel(z: number, lat: number): number {
  return (2 * Math.PI * EARTH_RADIUS_M * Math.cos(rad(lat))) / (TILE_SIZE * 2 ** z);
}
