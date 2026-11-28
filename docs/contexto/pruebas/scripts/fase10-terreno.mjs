// Fase 10 · terreno real (#24). Inventa una ruta GPX en una zona de montaña (nada
// real del usuario), con la altura de cada punto sacada del propio relieve, la
// importa, descarga en la caché de la app las teselas de relieve de la zona y abre
// la demo 3D de esa ruta, que debe verse con el relieve real y sin árboles ni
// montañas inventados. Necesita conexión.
// Uso: npm run build && npx vite preview --port 4173
//      OUT=<carpeta> node <runner> http://localhost:4173/rodillo-virtual/ <este archivo>
const OUT = process.env.OUT ?? '.';

export default async function run(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.reload();
  await page.waitForTimeout(800);

  // 1 · GPX inventado y teselas de relieve en la caché (las mismas URL que la app).
  const gpx = await page.evaluate(async () => {
    const tileXY = (lon, lat, z) => {
      const n = 2 ** z;
      const phi = (lat * Math.PI) / 180;
      return {
        x: ((lon + 180) / 360) * n,
        y: ((1 - Math.log(Math.tan(phi) + 1 / Math.cos(phi)) / Math.PI) / 2) * n,
      };
    };
    const url = (z, x, y) =>
      `https://elevation-tiles-prod.s3.amazonaws.com/terrarium/${z}/${x}/${y}.png`;
    const cache = await caches.open('rodillo-virtual-tiles');
    const heights = new Map();
    const getTile = async (z, x, y) => {
      const u = url(z, x, y);
      let res = await cache.match(u);
      if (!res) {
        const r = await fetch(u);
        await cache.put(u, r.clone());
        res = r;
      }
      return res.blob();
    };
    const decode = async (blob) => {
      const bmp = await createImageBitmap(blob, {
        colorSpaceConversion: 'none',
        premultiplyAlpha: 'none',
      });
      const c = new OffscreenCanvas(256, 256).getContext('2d', { willReadFrequently: true });
      c.drawImage(bmp, 0, 0);
      return c.getImageData(0, 0, 256, 256).data;
    };
    // Tiles around an invented point (near: ±0.06° lat, ±0.08° lon at z12; far: ±0.25°, ±0.34° at z9).
    const lat0 = 42.65;
    const lon0 = 0.05;
    let n = 0;
    for (const [z, dLat, dLon] of [
      [12, 0.06, 0.08],
      [9, 0.25, 0.34],
    ]) {
      const a = tileXY(lon0 - dLon, lat0 + dLat, z);
      const b = tileXY(lon0 + dLon, lat0 - dLat, z);
      for (let y = Math.floor(a.y); y <= Math.floor(b.y); y++)
        for (let x = Math.floor(a.x); x <= Math.floor(b.x); x++) {
          const px = await decode(await getTile(z, x, y));
          if (z === 12) heights.set(`${x}/${y}`, px);
          n++;
        }
    }
    // Invented 5 km track; each point takes the height of the relief under it.
    const pts = [];
    for (let i = 0; i <= 100; i++) {
      const lat = 42.64 + 0.02 * (i / 100) + 0.002 * Math.sin(i / 8);
      const lon = 0.03 + 0.04 * (i / 100);
      const t = tileXY(lon, lat, 12);
      const px = heights.get(`${Math.floor(t.x)}/${Math.floor(t.y)}`);
      const k = (Math.floor((t.y % 1) * 256) * 256 + Math.floor((t.x % 1) * 256)) * 4;
      const ele = px[k] * 256 + px[k + 1] + px[k + 2] / 256 - 32768;
      pts.push(
        `<trkpt lat="${lat.toFixed(6)}" lon="${lon.toFixed(6)}"><ele>${ele.toFixed(1)}</ele></trkpt>`,
      );
    }
    return {
      tiles: n,
      xml: `<?xml version="1.0"?><gpx version="1.1" creator="prueba"><trk><name>Prueba relieve</name><trkseg>${pts.join('')}</trkseg></trk></gpx>`,
    };
  });

  // 2 · Importar la ruta.
  await page.getByRole('tab', { name: 'Rutas' }).click();
  await page.locator('input[type=file][accept*=".gpx"]').setInputFiles({
    name: 'prueba-relieve.gpx',
    mimeType: 'application/gpx+xml',
    buffer: Buffer.from(gpx.xml),
  });
  await page
    .locator('option', { hasText: 'Prueba relieve' })
    .first()
    .waitFor({ state: 'attached' });

  // 3 · Demo 3D de esa ruta.
  await page.getByLabel('Ruta de la demo').selectOption({ label: 'Prueba relieve' });
  await page.getByRole('button', { name: 'Ver demo 3D' }).click();
  await page.locator('canvas').waitFor({ timeout: 30_000 });
  await page.waitForTimeout(12_000);
  await page.screenshot({ path: `${OUT}/terreno-real.png` });
  return { tiles: gpx.tiles, errors };
}
