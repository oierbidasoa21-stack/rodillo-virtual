/**
 * The flat local map the 3D world uses: metres east (x) and south (z) of a
 * centre, with an equirectangular projection (fine for a few tens of km).
 * The road (`projectRoute`) and the real terrain use the same frame, so they
 * line up exactly.
 */
export interface LocalFrame {
  lat0: number;
  lon0: number;
}

export const EARTH_RADIUS_M = 6_371_000;
const rad = (deg: number) => (deg * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

/** Frame centred on the average of the points (as the route projection does). */
export function frameOf(points: readonly { lat: number; lon: number }[]): LocalFrame {
  const n = Math.max(1, points.length);
  return {
    lat0: points.reduce((s, p) => s + p.lat, 0) / n,
    lon0: points.reduce((s, p) => s + p.lon, 0) / n,
  };
}

export function toLocal(f: LocalFrame, lon: number, lat: number): { x: number; z: number } {
  return {
    x: rad(lon - f.lon0) * EARTH_RADIUS_M * Math.cos(rad(f.lat0)),
    z: -rad(lat - f.lat0) * EARTH_RADIUS_M,
  };
}

export function toLonLat(f: LocalFrame, x: number, z: number): { lon: number; lat: number } {
  return {
    lon: f.lon0 + deg(x / (EARTH_RADIUS_M * Math.cos(rad(f.lat0)))),
    lat: f.lat0 - deg(z / EARTH_RADIUS_M),
  };
}
