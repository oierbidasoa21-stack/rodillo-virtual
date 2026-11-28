import type { LandscapeTile, TileLayer } from '../domain/geo/landscape';

/**
 * Where each layer comes from. Only these two origins are allowed by the CSP
 * (connect-src in docker/security-headers.conf): changing a host here means
 * changing the policy too.
 */
export const TILE_SOURCES: Record<TileLayer, { url: (t: LandscapeTile['tile']) => string }> = {
  // AWS Terrain Tiles (Terrarium). The bucket name in the host keeps the CSP
  // from allowing the rest of S3.
  terrain: {
    url: ({ z, x, y }) =>
      `https://elevation-tiles-prod.s3.amazonaws.com/terrarium/${z}/${x}/${y}.png`,
  },
  // Sentinel-2 cloudless 2024 by EOX (CC BY-NC-SA 4.0: personal, non-commercial use).
  // WMTS order is row (y) before column (x).
  imagery: {
    url: ({ z, x, y }) =>
      `https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2024_3857/default/g/${z}/${y}/${x}.jpg`,
  },
};

export const tileUrl = (t: LandscapeTile) => TILE_SOURCES[t.layer].url(t.tile);

/** Credit lines the 3D view and the manual must show while real landscape is on. */
export const TILE_ATTRIBUTION = [
  'Imagen: Sentinel-2 cloudless 2024 de EOX IT Services GmbH (s2maps.eu), con datos modificados de Copernicus Sentinel (2024). Licencia CC BY-NC-SA 4.0: uso no comercial.',
  'Relieve: AWS Terrain Tiles (Mapzen), con datos de SRTM, NED, ETOPO1 y otras fuentes públicas.',
];
