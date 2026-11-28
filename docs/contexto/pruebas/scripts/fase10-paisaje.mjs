// Fase 10 · interfaz del paisaje real (#26), de principio a fin y por la interfaz:
// importa una ruta GPX inventada en una zona de montaña (nada real del usuario),
// pide el paisaje desde su tarjeta (aviso de privacidad incluido), espera a que se
// descargue, abre la demo 3D (relieve, foto y atribución) y borra el paisaje.
// Guarda las capturas del manual: 16-paisaje-ruta, 17-paisaje-aviso y 18-paisaje-3d.
// Necesita conexión. Uso: npm run build && npx vite preview --port 4173
//      OUT=<carpeta> node <runner> http://localhost:4173/rodillo-virtual/ <este archivo>
const OUT = process.env.OUT ?? '.';

const cachedRouteTiles = (page) =>
  page.evaluate(async () => (await (await caches.open('rodillo-virtual-tiles')).keys()).length);

export default async function run(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.reload();
  await page.evaluate(() => caches.delete('rodillo-virtual-tiles'));
  await page.waitForTimeout(500);

  // 1 · Ruta inventada; la altura de cada punto sale del relieve (sin guardar nada en la caché de la app).
  const xml = await page.evaluate(async () => {
    const tileXY = (lon, lat, z) => {
      const n = 2 ** z;
      const phi = (lat * Math.PI) / 180;
      return {
        x: ((lon + 180) / 360) * n,
        y: ((1 - Math.log(Math.tan(phi) + 1 / Math.cos(phi)) / Math.PI) / 2) * n,
      };
    };
    const res = await fetch(
      'https://elevation-tiles-prod.s3.amazonaws.com/terrarium/12/2048/1510.png',
    );
    const bmp = await createImageBitmap(await res.blob(), {
      colorSpaceConversion: 'none',
      premultiplyAlpha: 'none',
    });
    const c = new OffscreenCanvas(256, 256).getContext('2d', { willReadFrequently: true });
    c.drawImage(bmp, 0, 0);
    const px = c.getImageData(0, 0, 256, 256).data;
    const pts = [];
    for (let i = 0; i <= 100; i++) {
      const lat = 42.64 + 0.02 * (i / 100) + 0.002 * Math.sin(i / 8);
      const lon = 0.03 + 0.04 * (i / 100);
      const t = tileXY(lon, lat, 12);
      const k = (Math.floor((t.y - 1510) * 256) * 256 + Math.floor((t.x - 2048) * 256)) * 4;
      const ele = px[k] * 256 + px[k + 1] + px[k + 2] / 256 - 32768;
      pts.push(
        `<trkpt lat="${lat.toFixed(6)}" lon="${lon.toFixed(6)}"><ele>${ele.toFixed(1)}</ele></trkpt>`,
      );
    }
    return `<?xml version="1.0"?><gpx version="1.1" creator="prueba"><trk><name>Valle de prueba</name><trkseg>${pts.join('')}</trkseg></trk></gpx>`;
  });
  await page.getByRole('tab', { name: 'Rutas' }).click();
  await page.locator('input[type=file][accept*=".gpx"]').setInputFiles({
    name: 'valle-de-prueba.gpx',
    mimeType: 'application/gpx+xml',
    buffer: Buffer.from(xml),
  });
  const card = page
    .locator('article.card', { has: page.locator('h3', { hasText: 'Valle de prueba' }) })
    .first();
  await card.waitFor();
  const offer = await card.locator('.landscape').innerText();
  await card.scrollIntoViewIfNeeded();
  await card.screenshot({ path: `${OUT}/16-paisaje-ruta.png` });

  // 2 · Aviso de privacidad y descarga.
  await card.getByRole('button', { name: 'Descargar paisaje real' }).click();
  await card.screenshot({ path: `${OUT}/17-paisaje-aviso.png` });
  const notice = await card.locator('.landscape-ask').innerText();
  await card.getByRole('button', { name: 'Descargar', exact: true }).click();
  await card.getByText('descargado el').waitFor({ timeout: 120_000 });
  const done = await card.locator('.landscape').innerText();
  const tilesAfterDownload = await cachedRouteTiles(page);

  // 3 · Demo 3D de la ruta: relieve, foto y atribución.
  await page.getByLabel('Ruta de la demo').selectOption({ label: 'Valle de prueba' });
  await page.getByRole('button', { name: 'Ver demo 3D' }).click();
  await page.locator('canvas').waitFor({ timeout: 30_000 });
  await page.locator('.world-attribution').waitFor({ timeout: 30_000 });
  await page.waitForTimeout(10_000);
  await page.screenshot({ path: `${OUT}/18-paisaje-3d.png` });
  const attribution = await page.locator('.world-attribution').innerText();
  await page.getByRole('button', { name: 'Salir de la demo' }).click();

  // 4 · Borrar el paisaje: se van sus teselas.
  const card2 = page
    .locator('article.card', { has: page.locator('h3', { hasText: 'Valle de prueba' }) })
    .first();
  await card2.getByRole('button', { name: 'Borrar paisaje' }).click();
  await card2.getByRole('button', { name: /Pulsa otra vez/ }).click();
  await card2.getByRole('button', { name: 'Descargar paisaje real' }).waitFor();
  await page.waitForTimeout(500);
  const tilesAfterDelete = await cachedRouteTiles(page);

  return { offer, notice, done, attribution, tilesAfterDownload, tilesAfterDelete, errors };
}
